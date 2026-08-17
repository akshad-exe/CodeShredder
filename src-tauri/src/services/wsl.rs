//! WSL interaction: enumerates distros, finds their virtual disks, shuts WSL
//! down and compacts disks via diskpart.
//!
//! Everything that parses command output is a pure function so it can be unit
//! tested cross-platform; only the process executors are Windows-gated. On
//! non-Windows targets the executors return empty results / errors so the
//! module still compiles everywhere.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use crate::domain::wsl::{WslCleanupResult, WslCompactResult, WslDistro, WslProgress, WslState};

/// Builds a progress event.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn progress(operation: &str, level: &str, step: impl Into<String>) -> WslProgress {
    WslProgress {
        operation: operation.to_string(),
        level: level.to_string(),
        step: step.into(),
    }
}

/// Enumerates installed WSL distros with their running state.
///
/// Runs `wsl --list --verbose`, then attaches each distro's virtual disk path
/// and size (resolved via the `Lxss` registry entries).
#[cfg(target_os = "windows")]
pub fn list_distros() -> std::result::Result<Vec<WslDistro>, String> {
    let list_output = run_capture("wsl.exe", &["--list", "--verbose"])?;
    let distros = parse_wsl_list_output(&list_output);

    let reg_output = run_capture(
        "reg.exe",
        &["query", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Lxss", "/s"],
    )
    .unwrap_or_default();
    let sections = parse_reg_sections(&reg_output);

    let mut result = Vec::new();
    for (name, state) in distros {
        let vhdx_path = vhdx_path_for_distro(&name, &sections)
            .or_else(|| fallback_scan(&name));
        let size_bytes = vhdx_path.as_ref().and_then(|p| disk_size(Path::new(p)));
        result.push(WslDistro {
            name,
            state,
            vhdx_path,
            size_bytes,
        });
    }
    Ok(result)
}

/// Non-Windows stub so the module compiles everywhere.
#[cfg(not(target_os = "windows"))]
pub fn list_distros() -> std::result::Result<Vec<WslDistro>, String> {
    Ok(Vec::new())
}

/// Shuts down every running WSL distro. Required before compacting a disk.
#[cfg(target_os = "windows")]
pub fn shutdown_all() -> std::result::Result<(), String> {
    let out = Command::new("wsl.exe")
        .arg("--shutdown")
        .output()
        .map_err(|e| e.to_string())?;
    if out.status.success() {
        Ok(())
    } else {
        Err(format!(
            "wsl --shutdown failed: {}",
            decode_output(out.stdout)
        ))
    }
}

/// Non-Windows stub.
#[cfg(not(target_os = "windows"))]
pub fn shutdown_all() -> std::result::Result<(), String> {
    Err("WSL is only available on Windows".to_string())
}

/// Compacts a distro's virtual disk: shuts WSL down, runs diskpart's
/// `compact vdisk` and reports the bytes reclaimed. Progress events are
/// streamed through `on_progress` so the frontend can show live feedback.
#[cfg(target_os = "windows")]
pub fn compact_distro(distro: &str, on_progress: &mut dyn FnMut(WslProgress)) -> WslCompactResult {
    let mut result = WslCompactResult {
        distro: distro.to_string(),
        before_bytes: None,
        after_bytes: None,
        freed_bytes: None,
        error: None,
    };

    on_progress(progress(
        "compact",
        "info",
        "Shutting down all WSL distros…",
    ));
    let _ = shutdown_all();

    on_progress(progress(
        "compact",
        "info",
        format!("Locating virtual disk for {distro}…"),
    ));
    let sections = parse_reg_sections(
        &run_capture(
            "reg.exe",
            &["query", r"HKCU\Software\Microsoft\Windows\CurrentVersion\Lxss", "/s"],
        )
        .unwrap_or_default(),
    );
    let Some(vhdx) = vhdx_path_for_distro(distro, &sections)
        .or_else(|| fallback_scan(distro))
    else {
        result.error = Some(format!("Could not locate the virtual disk for {distro}"));
        on_progress(progress(
            "compact",
            "error",
            format!("Could not locate the virtual disk for {distro}"),
        ));
        return result;
    };

    let before = disk_size(Path::new(&vhdx));
    result.before_bytes = before;
    if before.unwrap_or(0) == 0 {
        result.error = Some(format!("Virtual disk not found or empty: {vhdx}"));
        on_progress(progress(
            "compact",
            "error",
            format!("Virtual disk not found or empty: {vhdx}"),
        ));
        return result;
    }

    on_progress(progress(
        "compact",
        "info",
        format!("Compacting {vhdx} — may take a while…"),
    ));
    let mut compacted = false;
    match run_diskpart_compact(Path::new(&vhdx), false) {
        Ok(()) => compacted = true,
        Err(err) if is_elevation_error(&err) => {
            on_progress(progress(
                "compact",
                "info",
                format!("Compaction needs administrator rights — approve the prompt to continue…"),
            ));
            match run_diskpart_compact(Path::new(&vhdx), true) {
                Ok(()) => compacted = true,
                Err(err2) => {
                    result.error = Some(err2.clone());
                    on_progress(progress("compact", "error", format!("Compact failed: {err2}")));
                }
            }
        }
        Err(err) => {
            result.error = Some(err.clone());
            on_progress(progress("compact", "error", format!("Compact failed: {err}")));
        }
    }
    if compacted {
        finish_compact_success(distro, Path::new(&vhdx), before, &mut result, on_progress);
    }
    result
}

/// Records post-compaction disk size and streams the success event.
#[cfg(target_os = "windows")]
fn finish_compact_success(
    distro: &str,
    vhdx: &Path,
    before: Option<u64>,
    result: &mut WslCompactResult,
    on_progress: &mut dyn FnMut(WslProgress),
) {
    let after = disk_size(vhdx);
    result.after_bytes = after;
    result.freed_bytes = match (before, after) {
        (Some(b), Some(a)) => Some(b.saturating_sub(a)),
        _ => None,
    };
    match result.freed_bytes {
        Some(freed) if freed > 0 => on_progress(progress(
            "compact",
            "success",
            format!("Freed {} from {distro}", format_bytes(freed)),
        )),
        _ => on_progress(progress(
            "compact",
            "success",
            format!("Disk for {distro} is already compact"),
        )),
    }
}

/// True when an error message suggests the operation failed only because it
/// needs administrator rights (e.g. `os error 740`).
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn is_elevation_error(msg: &str) -> bool {
    let lower = msg.to_lowercase();
    lower.contains("elevat") || lower.contains("740") || lower.contains("denied")
}

/// Non-Windows stub.
#[cfg(not(target_os = "windows"))]
pub fn compact_distro(distro: &str, on_progress: &mut dyn FnMut(WslProgress)) -> WslCompactResult {
    on_progress(progress(
        "compact",
        "error",
        "WSL is only available on Windows",
    ));
    WslCompactResult {
        distro: distro.to_string(),
        before_bytes: None,
        after_bytes: None,
        freed_bytes: None,
        error: Some("WSL is only available on Windows".to_string()),
    }
}

/// Runs a shell command inside a distro (as the distro's default user).
/// Intended for safe, user-level cache cleanup. Progress events are streamed
/// through `on_progress`.
#[cfg(target_os = "windows")]
pub fn run_cleanup(distro: &str, commands: &str, on_progress: &mut dyn FnMut(WslProgress)) -> WslCleanupResult {
    on_progress(progress(
        "cleanup",
        "info",
        format!("Running cleanup in {distro}…"),
    ));
    let out = Command::new("wsl.exe")
        .args(["-d", distro, "-e", "bash", "-lc", commands])
        .output();
    match out {
        Ok(out) => {
            let success = out.status.success();
            let output = decode_output([out.stdout, out.stderr].concat()).trim().to_string();
            on_progress(progress(
                "cleanup",
                if success { "success" } else { "error" },
                format!(
                    "Cleanup {} in {distro}",
                    if success { "finished" } else { "failed" }
                ),
            ));
            WslCleanupResult {
                distro: distro.to_string(),
                success,
                output,
            }
        }
        Err(err) => {
            on_progress(progress(
                "cleanup",
                "error",
                format!("Could not start cleanup: {err}"),
            ));
            WslCleanupResult {
                distro: distro.to_string(),
                success: false,
                output: err.to_string(),
            }
        }
    }
}

/// Non-Windows stub.
#[cfg(not(target_os = "windows"))]
pub fn run_cleanup(distro: &str, _commands: &str, on_progress: &mut dyn FnMut(WslProgress)) -> WslCleanupResult {
    on_progress(progress(
        "cleanup",
        "error",
        "WSL is only available on Windows",
    ));
    WslCleanupResult {
        distro: distro.to_string(),
        success: false,
        output: "WSL is only available on Windows".to_string(),
    }
}

/// Formats a byte count for progress messages.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn format_bytes(bytes: u64) -> String {
    const UNITS: [&str; 5] = ["B", "KB", "MB", "GB", "TB"];
    let mut value = bytes as f64;
    let mut unit = 0;
    while value >= 1024.0 && unit < UNITS.len() - 1 {
        value /= 1024.0;
        unit += 1;
    }
    if unit == 0 {
        format!("{bytes} {}", UNITS[unit])
    } else {
        format!("{value:.1} {}", UNITS[unit])
    }
}

/// Resolves the virtual disk path for a distro from parsed `Lxss` registry
/// entries, falling back to the `Packages` layout when the registry is missing.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn vhdx_path_for_distro(distro: &str, sections: &[(String, HashMap<String, String>)]) -> Option<String> {
    base_path_for(distro, sections).and_then(|base| {
        disk_path_from_base(&base).map(|p| p.to_string_lossy().into_owned())
    })
}

/// Looks up `BasePath` for a distro in the `Lxss` registry sections.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn base_path_for(distro: &str, sections: &[(String, HashMap<String, String>)]) -> Option<String> {
    for (_key, values) in sections {
        if let Some(name) = values.get("DistributionName") {
            if name.eq_ignore_ascii_case(distro) {
                return values.get("BasePath").cloned();
            }
        }
    }
    None
}

/// Given a `BasePath`, finds the actual virtual disk file: either the base is
/// the file itself, or it contains `ext4.vhdx` (WSL2) / `ext4.vhd` (legacy).
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn disk_path_from_base(base: &str) -> Option<PathBuf> {
    let base = Path::new(base);
    for candidate in [base, &base.join("ext4.vhdx"), &base.join("ext4.vhd")] {
        if candidate.is_file() {
            return Some(candidate.to_path_buf());
        }
    }
    None
}

/// Last-resort discovery: scans `%LOCALAPPDATA%\Packages\*\LocalState` for a
/// virtual disk whose package folder matches the distro name.
#[cfg(target_os = "windows")]
fn fallback_scan(distro: &str) -> Option<String> {
    let localappdata = std::env::var("LOCALAPPDATA").ok()?;
    let packages_root = Path::new(&localappdata).join("Packages");
    discover_vhdx(&packages_root, distro).map(|p| p.to_string_lossy().into_owned())
}

/// Non-Windows stub.
#[cfg(not(target_os = "windows"))]
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn fallback_scan(_distro: &str) -> Option<String> {
    None
}

/// Scans `<packages_root>/*/LocalState` for a virtual disk belonging to the
/// distro, matching package folder names against the distro name.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn discover_vhdx(packages_root: &Path, distro: &str) -> Option<PathBuf> {
    let entries = packages_root.read_dir().ok()?;
    for entry in entries.flatten() {
        let pkg = entry.file_name().to_string_lossy().into_owned();
        if !package_matches_distro(&pkg, distro) {
            continue;
        }
        let local_state = entry.path().join("LocalState");
        for name in ["ext4.vhdx", "ext4.vhd"] {
            let candidate = local_state.join(name);
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    None
}

/// Whether a package folder belongs to a distro (either name contains the
/// other, case-insensitively, ignoring the store's suffix).
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn package_matches_distro(pkg: &str, distro: &str) -> bool {
    let p = pkg.to_lowercase();
    let d = distro.to_lowercase();
    p.contains(&d) || d.contains(&p)
}

/// Size of a file in bytes.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn disk_size(path: &Path) -> Option<u64> {
    std::fs::metadata(path).ok().map(|m| m.len())
}

/// Runs a command and returns its captured stdout as a decoded string.
#[cfg(target_os = "windows")]
fn run_capture(program: &str, args: &[&str]) -> std::result::Result<String, String> {
    let out = Command::new(program)
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;
    Ok(decode_output(out.stdout))
}

/// Runs diskpart on a script that selects and compacts a virtual disk.
#[cfg(target_os = "windows")]
fn run_diskpart_compact(vhdx: &Path, elevated: bool) -> std::result::Result<(), String> {
    use std::process::Command;

    let script = format!(
        "select vdisk file=\"{}\"\ncompact vdisk\nexit\n",
        vhdx.display()
    );
    let script_path = std::env::temp_dir().join(format!("cs-diskpart-{}.txt", std::process::id()));
    std::fs::write(&script_path, script).map_err(|e| e.to_string())?;

    // Elevated runs go through ShellExecute with the `runas` verb, which pops
    // the UAC prompt; stdout/stderr cannot be captured that way, so success is
    // judged by the exit code alone (diskpart returns non-zero on failure, and
    // a dismissed prompt also yields a non-zero code). ShellExecute needs a
    // full path, so resolve diskpart from SystemRoot.
    let diskpart = std::env::var("SystemRoot")
        .map(|root| format!(r"{root}\System32\diskpart.exe"))
        .unwrap_or_else(|_| "diskpart".to_string());
    let result = if elevated {
        runas::Command::new(&diskpart)
            .args(&["/s", script_path.to_str().unwrap_or_default()])
            .show(false)
            .status()
            .map(|status| (status, String::new()))
    } else {
        Command::new(&diskpart)
            .args(["/s", script_path.to_str().unwrap_or_default()])
            .output()
            .map(|out| (out.status, decode_output([out.stdout, out.stderr].concat())))
    };

    let _ = std::fs::remove_file(&script_path);

    match result {
        Ok((status, text)) if status.success() && !text.to_lowercase().contains("error") => Ok(()),
        Ok((_, text)) if text.trim().is_empty() => Err(
            "diskpart compact failed: the elevated compaction was cancelled or did not complete"
                .to_string(),
        ),
        Ok((_, text)) => Err(format!("diskpart compact failed: {text}")),
        Err(err) => Err(err.to_string()),
    }
}

/// Parses `wsl --list --verbose` output into `(name, state)` pairs.
///
/// Real rows are `NAME STATE VERSION` with a trailing `1` or `2` version
/// column; headings end in `:` and informational messages lack the version
/// column, so both are skipped. Localized state words degrade to `Stopped`.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn parse_wsl_list_output(output: &str) -> Vec<(String, WslState)> {
    let mut distros = Vec::new();
    for line in output.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.ends_with(':') {
            continue;
        }
        let tokens: Vec<&str> = trimmed.split_whitespace().collect();
        if tokens.len() < 3 {
            continue;
        }
        // The default distro is flagged with a leading `*`, which `wsl -l -v`
        // prints as its own token ("* Ubuntu ..."), so skip any leading stars.
        let mut name = tokens[0];
        let mut idx = 0;
        while name == "*" && idx + 1 < tokens.len() {
            idx += 1;
            name = tokens[idx];
        }
        let name = name.trim_start_matches('*');
        if name.is_empty() || name.eq_ignore_ascii_case("name") {
            continue;
        }
        // Every real row ends with the WSL version (1 or 2); messages such as
        // "no installed distributions" do not.
        if !matches!(tokens.last(), Some(&"1" | &"2")) {
            continue;
        }
        let state = tokens
            .iter()
            .find_map(|t| state_for(t))
            .unwrap_or(WslState::Stopped);
        distros.push((name.to_string(), state));
    }
    distros
}

/// Maps a token to a state, tolerating a couple of common localizations.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn state_for(token: &str) -> Option<WslState> {
    let t = token.to_lowercase();
    if t.contains("running") || t.contains("ausgeführt") {
        Some(WslState::Running)
    } else if t.contains("stopped") || t.contains("angehalten") || t.contains("angestoppt") {
        Some(WslState::Stopped)
    } else {
        None
    }
}

/// Parses `reg query <key> /s` output into per-key value maps.
///
/// Each section is headed by a full `HKEY_...` line followed by
/// `Name  REG_TYPE  value` rows.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn parse_reg_sections(output: &str) -> Vec<(String, HashMap<String, String>)> {
    let mut sections: Vec<(String, HashMap<String, String>)> = Vec::new();
    let mut current: Option<(String, HashMap<String, String>)> = None;
    for line in output.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("HKEY_") {
            if let Some(section) = current.take() {
                sections.push(section);
            }
            current = Some((trimmed.to_string(), HashMap::new()));
        } else if let Some((_, values)) = current.as_mut() {
            let mut parts = trimmed.split_whitespace();
            if let (Some(name), Some(reg_type)) = (parts.next(), parts.next()) {
                if reg_type.starts_with("REG_") {
                    let value = parts.collect::<Vec<_>>().join(" ");
                    values.insert(name.to_string(), value);
                }
            }
        }
    }
    if let Some(section) = current {
        sections.push(section);
    }
    sections
}

/// Decodes command output, handling the UTF-16LE encoding that `wsl.exe` uses
/// when piped (detected via embedded NUL bytes).
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn decode_output(bytes: Vec<u8>) -> String {
    if bytes.contains(&0) {
        let units: Vec<u16> = bytes
            .chunks_exact(2)
            .map(|c| u16::from_le_bytes([c[0], c[1]]))
            .collect();
        String::from_utf16_lossy(&units)
    } else {
        String::from_utf8_lossy(&bytes).into_owned()
    }
}

#[cfg(target_os = "windows")]
use std::process::Command;

#[cfg(test)]
mod tests {
    use super::*;

    const WSL_OUTPUT: &str = "\
  NAME                    STATE           VERSION
* Ubuntu                 Running         2
  Debian                 Stopped         1
  Ubuntu-22.04           Stopped         2
";

    #[test]
    fn parses_wsl_verbose_output() {
        let distros = parse_wsl_list_output(WSL_OUTPUT);
        assert_eq!(distros.len(), 3);
        assert_eq!(distros[0], ("Ubuntu".to_string(), WslState::Running));
        assert_eq!(distros[1], ("Debian".to_string(), WslState::Stopped));
        assert_eq!(distros[2], ("Ubuntu-22.04".to_string(), WslState::Stopped));
    }

    #[test]
    fn skips_headings_and_no_distro_message() {
        let output = "\
Windows Subsystem for Linux Distributions:
NAME                    STATE           VERSION
Windows Subsystem for Linux has no installed distributions.
";
        assert!(parse_wsl_list_output(output).is_empty());
    }

    #[test]
    fn decodes_utf16le_output() {
        // "Ubuntu  Running" as UTF-16LE with a BOM.
        let bytes = b"\xff\xfeU\x00b\x00u\x00n\x00t\x00u\x00 \x00 \x00R\x00u\x00n\x00n\x00i\x00n\x00g\x00";
        assert!(decode_output(bytes.to_vec()).contains("Ubuntu"));
    }

    #[test]
    fn parses_reg_sections() {
        let output = "\
HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Lxss

    {aaaa}    REG_SZ

HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Lxss\\{aaaa}
    DistributionName    REG_SZ    Ubuntu-22.04
    Version             REG_DWORD    0x2
    BasePath            REG_SZ    C:\\Users\\me\\AppData\\Local\\wsl\\ubuntu
";
        let sections = parse_reg_sections(output);
        assert_eq!(sections.len(), 2);
        let base = base_path_for("ubuntu-22.04", &sections);
        assert_eq!(
            base.as_deref(),
            Some(r"C:\Users\me\AppData\Local\wsl\ubuntu")
        );
    }

    #[test]
    fn matches_package_to_distro() {
        assert!(package_matches_distro("CanonicalGroupLimited.UbuntuonWindows", "Ubuntu"));
        assert!(package_matches_distro("Ubuntu-22.04.", "Ubuntu-22.04"));
        assert!(!package_matches_distro("Debian", "Fedora"));
    }

    #[test]
    fn stubs_emit_progress_events() {
        let events = std::cell::RefCell::new(Vec::new());
        let mut on_progress = |p: WslProgress| events.borrow_mut().push(p);

        let cleanup = run_cleanup("Ubuntu", "apt-get clean", &mut on_progress);
        assert!(!cleanup.success);
        assert!(!events.borrow().is_empty());

        let compact = compact_distro("Ubuntu", &mut on_progress);
        assert!(compact.error.is_some());
        assert!(events
            .borrow()
            .iter()
            .any(|e| e.level == "error"));
        assert!(events.borrow().iter().any(|e| e.operation == "compact"));
    }

    #[test]
    fn detects_elevation_errors() {
        assert!(is_elevation_error(
            "The requested operation requires elevation. (os error 740)"
        ));
        assert!(is_elevation_error("diskpart compact failed: Access is denied"));
        assert!(is_elevation_error("permission denied"));
        assert!(!is_elevation_error("diskpart compact failed: no disk found"));
        assert!(!is_elevation_error(""));
    }
}

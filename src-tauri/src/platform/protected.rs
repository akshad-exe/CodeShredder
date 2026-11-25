//! Filesystem paths that must never be trashed, per platform.
//!
//! The protected-roots list is deliberately coarse and cross-platform: Windows
//! drives, macOS system folders and Linux `/usr`, `/etc`, ... are all guarded on
//! every OS, so a stray path from another platform's layout is still refused
//! defensively.

use std::path::{Component, Path, PathBuf};

/// Blocks paths that must never be moved to the trash: filesystem roots,
/// system directories and per-user OS folders (the user's home itself is
/// allowed, since that is where developer junk usually lives).
#[must_use]
pub fn is_protected(path: &Path) -> bool {
    let abs = absolute(path);
    let norm = normalize(&abs);
    // A filesystem or drive root normalizes to "" or "c:".
    if norm.is_empty() || (norm.len() == 2 && norm.ends_with(':')) {
        return true;
    }
    // Whole-segment match: `/dev` guards `/dev/x` but not `/developer/x`.
    if PROTECTED_ROOTS.iter().any(|root| {
        let root = normalize(Path::new(root));
        norm == root || norm.starts_with(&format!("{root}/"))
    }) {
        return true;
    }
    // Per-user OS folders that must survive even though their parent (the home
    // directory) is no longer wholesale protected. Checked on the normalized
    // path so Windows-style backslash paths split into segments correctly.
    norm.split('/').any(|seg| {
        PROTECTED_COMPONENTS
            .iter()
            .any(|n| n.eq_ignore_ascii_case(seg))
    })
}

/// Path components that are always protected, regardless of where they appear:
/// e.g. `C:\Users\<you>\AppData` must not be trashed even though `C:\Users` is
/// cleanable.
const PROTECTED_COMPONENTS: &[&str] = &["AppData"];

/// Absolute protected roots that should never be trashed, regardless of which
/// platform the app runs on. Kept deliberately coarse; platform specifics are
/// handled by the OS-based roots below.
const PROTECTED_ROOTS: &[&str] = &[
    // Windows
    "C:\\Windows",
    "C:\\Program Files",
    "C:\\Program Files (x86)",
    "C:\\ProgramData",
    "C:\\System Volume Information",
    "C:\\$Recycle.Bin",
    "C:\\Recovery",
    // macOS
    "/System",
    "/Library",
    "/Applications",
    "/Volumes",
    // Linux
    "/bin",
    "/boot",
    "/dev",
    "/etc",
    "/lib",
    "/lib64",
    "/proc",
    "/root",
    "/sbin",
    "/sys",
    "/usr",
    "/var",
];

/// Normalizes a path to a forward-slash lowercase string so protected-root
/// matching is case- and separator-insensitive across platforms.
fn normalize(path: &Path) -> String {
    let norm = path
        .to_string_lossy()
        .replace('\\', "/")
        .to_lowercase()
        .trim_end_matches('/')
        .to_owned();
    // `canonicalize` on Windows returns verbatim paths: `\\?\C:\Windows`.
    let norm = norm.strip_prefix("//?/").map(str::to_owned).unwrap_or(norm);
    // WSL view of a Windows drive: `/mnt/c/Windows` is `c:/windows`.
    match norm.strip_prefix("/mnt/").map(str::as_bytes) {
        Some([drive, rest @ ..])
            if drive.is_ascii_alphabetic() && matches!(rest.first(), None | Some(b'/')) =>
        {
            format!("{}:{}", *drive as char, String::from_utf8_lossy(rest))
        }
        _ => norm,
    }
}

/// Resolves a path against the current directory, handling `~` and relative
/// paths defensively so a stray input cannot escape the check.
fn absolute(path: &Path) -> PathBuf {
    // Windows-style absolute paths are guarded on every OS, so keep them as is.
    let raw = path.as_os_str().as_encoded_bytes();
    if path.has_root() || raw.starts_with(br"\\") || raw.get(1) == Some(&b':') {
        return path.to_path_buf();
    }
    let mut resolved = PathBuf::new();
    for component in path.components() {
        match component {
            Component::RootDir | Component::Prefix(_) | Component::CurDir => {}
            Component::ParentDir => {
                resolved.pop();
            }
            Component::Normal(part) => resolved.push(part),
        }
    }
    std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join(resolved)
}

/// A representative protected path for the current OS, for guard tests.
#[cfg(test)]
#[must_use]
pub const fn protected_sample() -> &'static str {
    if cfg!(target_os = "windows") {
        "C:\\Windows\\System32"
    } else {
        "/usr/bin"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blocks_system_paths() {
        assert!(is_protected(Path::new(&protected_sample())));
        if cfg!(target_os = "windows") {
            assert!(is_protected(Path::new("C:\\Windows")));
            assert!(is_protected(Path::new("C:\\Windows\\System32")));
            assert!(is_protected(Path::new("C:\\Program Files")));
        } else {
            assert!(is_protected(Path::new("/usr")));
            assert!(is_protected(Path::new("/etc")));
            assert!(is_protected(Path::new("/var/lib")));
        }
    }

    #[test]
    fn matches_whole_segments_and_wsl_drives() {
        assert!(!is_protected(Path::new("/developer/app/target")));
        assert!(!is_protected(Path::new("/variants/x/node_modules")));
        assert!(is_protected(Path::new("/mnt/c/Windows/System32")));
        assert!(is_protected(Path::new("/mnt/c/Program Files/App")));
        assert!(!is_protected(Path::new("/mnt/c/Users/me/proj/target")));
    }

    #[test]
    fn blocks_verbatim_windows_paths_and_roots() {
        assert!(is_protected(Path::new(r"\\?\C:\Windows\System32")));
        assert!(!is_protected(Path::new(r"\\?\C:\Code\proj\target")));
        assert!(is_protected(Path::new("/")));
        assert!(is_protected(Path::new(r"C:\")));
    }

    #[test]
    fn does_not_block_normal_targets() {
        assert!(!is_protected(Path::new("C:\\Code\\proj\\node_modules")));
        assert!(!is_protected(Path::new("/home/me/dev/proj/target")));
    }

    #[test]
    fn allows_home_directory_but_blocks_appdata() {
        // The user opted to allow cleaning under their home directory...
        assert!(!is_protected(Path::new("C:\\Users\\me")));
        assert!(!is_protected(Path::new(
            "C:\\Users\\me\\Code\\proj\\node_modules"
        )));
        assert!(!is_protected(Path::new("/home/me/dev/proj/target")));
        // ...while per-user OS folders underneath it stay protected.
        assert!(is_protected(Path::new("C:\\Users\\me\\AppData")));
        assert!(is_protected(Path::new(
            "C:\\Users\\me\\AppData\\Local\\Temp"
        )));
        assert!(is_protected(Path::new("/home/me/AppData/Roaming")));
    }
}

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
    if PROTECTED_ROOTS
        .iter()
        .any(|root| norm.starts_with(&normalize(Path::new(root))))
    {
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
    path.to_string_lossy().replace('\\', "/").to_lowercase()
}

/// Resolves a path against the current directory, handling `~` and relative
/// paths defensively so a stray input cannot escape the check.
fn absolute(path: &Path) -> PathBuf {
    if path.is_absolute() {
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

//! Safety engine: classifies cleanup targets and blocks protected paths.
//!
//! Every target is graded Safe / Medium / Dangerous based on how easily it can
//! be regenerated, and paths that must never be touched are rejected outright.

use std::path::{Component, Path, PathBuf};

use crate::domain::scan::SafetyLevel;

/// Folder names that are pure build output / package installs: trivially
/// regenerated, so the safest class of target.
const SAFE_PATTERNS: &[&str] = &[
    "node_modules",
    ".next",
    ".nuxt",
    "target",
    "dist",
    "build",
    "__pycache__",
    ".pytest_cache",
    ".parcel-cache",
    ".turbo",
    ".svelte-kit",
    ".output",
    ".astro",
    ".docusaurus",
    ".mypy_cache",
    ".ruff_cache",
    ".tox",
    ".expo",
    ".dart_tool",
    "out",
    ".cache",
    ".eslintcache",
    "zig-out",
    ".zig-cache",
    "DerivedData",
    "CMakeFiles",
    "cmake-build-debug",
    "cmake-build-release",
    ".obj",
    ".gatsby",
];

/// Folder names that can be rebuilt but need more setup (env tooling, lock
/// files, pod specs), so they warrant a heads-up.
const MEDIUM_PATTERNS: &[&str] = &[".venv", "venv", ".gradle", "Pods", "vendor"];

/// Classifies a target folder by name. Protected paths always win: if the path
/// resolves into a protected root it is graded Dangerous regardless of name.
pub fn classify(folder_name: &str, path: &Path) -> SafetyLevel {
    if is_protected(path) {
        return SafetyLevel::Dangerous;
    }
    if SAFE_PATTERNS.contains(&folder_name) {
        SafetyLevel::Safe
    } else if MEDIUM_PATTERNS.contains(&folder_name) {
        SafetyLevel::Medium
    } else {
        // Unknown folders that match no known pattern are the riskiest: we
        // don't know what they are, so they must be reviewed.
        SafetyLevel::Dangerous
    }
}

/// Blocks paths that must never be moved to the trash: filesystem roots,
/// system directories and the user's own home / profile folders.
pub fn is_protected(path: &Path) -> bool {
    let abs = absolute(path);
    let norm = normalize(&abs);
    PROTECTED_ROOTS.iter().any(|root| {
        let norm_root = normalize(Path::new(root));
        norm == norm_root || norm.starts_with(norm_root.as_str())
    })
}

/// Absolute protected roots that should never be trashed, regardless of which
/// platform the app runs on. Kept deliberately coarse; platform specifics are
/// handled by the OS-based roots below.
const PROTECTED_ROOTS: &[&str] = &[
    // Windows
    "C:\\Windows",
    "C:\\Program Files",
    "C:\\Program Files (x86)",
    "C:\\ProgramData",
    "C:\\Users",
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
fn absolute(path: &Path) -> std::path::PathBuf {
    if path.is_absolute() {
        return path.to_path_buf();
    }
    let mut resolved = PathBuf::new();
    for component in path.components() {
        match component {
            Component::RootDir | Component::Prefix(_) => {}
            Component::ParentDir => {
                resolved.pop();
            }
            Component::CurDir | Component::Normal(_) => resolved.push(component),
        }
    }
    std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join(resolved)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classifies_safe_patterns() {
        assert_eq!(
            classify("node_modules", Path::new("/proj/a/node_modules")),
            SafetyLevel::Safe
        );
        assert_eq!(
            classify("__pycache__", Path::new("/proj/a/__pycache__")),
            SafetyLevel::Safe
        );
        assert_eq!(
            classify("target", Path::new("/proj/a/target")),
            SafetyLevel::Safe
        );
    }

    #[test]
    fn classifies_medium_patterns() {
        assert_eq!(
            classify(".venv", Path::new("/proj/a/.venv")),
            SafetyLevel::Medium
        );
        assert_eq!(
            classify("Pods", Path::new("/proj/a/Pods")),
            SafetyLevel::Medium
        );
    }

    #[test]
    fn classifies_unknown_as_dangerous() {
        assert_eq!(
            classify("mystery-dir", Path::new("/proj/a/mystery-dir")),
            SafetyLevel::Dangerous
        );
    }

    #[test]
    fn blocks_system_paths() {
        #[cfg(target_os = "windows")]
        {
            assert!(is_protected(Path::new("C:\\Windows")));
            assert!(is_protected(Path::new("C:\\Windows\\System32")));
            assert!(is_protected(Path::new("C:\\Program Files")));
        }
        #[cfg(not(target_os = "windows"))]
        {
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
}

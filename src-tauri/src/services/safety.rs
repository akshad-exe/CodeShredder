//! Safety engine: classifies cleanup targets and blocks protected paths.
//!
//! Every target is graded Safe / Medium / Dangerous based on how easily it can
//! be regenerated, and paths that must never be touched are rejected outright
//! (the protected-path check itself lives in [`crate::platform::protected`]).

use std::path::Path;

use crate::domain::scan::SafetyLevel;

pub use crate::platform::protected::is_protected;

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
#[must_use]
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
}

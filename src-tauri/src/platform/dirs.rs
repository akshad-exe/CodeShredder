//! Resolution of well-known user directories per OS.
//!
//! Every helper answers one logical question ("where is the home directory?",
//! "where is `LOCALAPPDATA`?") and hides which environment variable the current
//! operating system exposes. Windows-only locations return `None` on other
//! platforms so callers stay portable.

use std::path::PathBuf;

/// Joins a home-relative path on the current platform. Uses `USERPROFILE` on
/// Windows and `HOME` elsewhere. Returns `None` when the home directory cannot
/// be resolved.
#[cfg(not(target_os = "windows"))]
#[must_use]
pub fn home(rel: &str) -> Option<PathBuf> {
    std::env::var_os("HOME").map(|home| PathBuf::from(home).join(rel))
}

/// Joins a home-relative path on the current platform. Uses `USERPROFILE` on
/// Windows and `HOME` elsewhere. Returns `None` when the home directory cannot
/// be resolved.
#[cfg(target_os = "windows")]
#[must_use]
pub fn home(rel: &str) -> Option<PathBuf> {
    std::env::var_os("USERPROFILE").map(|home| PathBuf::from(home).join(rel))
}

/// Joins a `LOCALAPPDATA`-relative path (Windows local app data / caches).
/// Always `None` on other platforms.
#[cfg(target_os = "windows")]
#[must_use]
pub fn local_app_data(rel: &str) -> Option<PathBuf> {
    std::env::var_os("LOCALAPPDATA").map(|root| PathBuf::from(root).join(rel))
}

/// Joins a `LOCALAPPDATA`-relative path (Windows local app data / caches).
/// Always `None` on other platforms.
#[cfg(not(target_os = "windows"))]
#[must_use]
pub const fn local_app_data(_rel: &str) -> Option<PathBuf> {
    None
}

/// Joins a Windows env-var-relative path (e.g. `%WINDIR%`). Always `None` on
/// other platforms.
#[cfg(target_os = "windows")]
#[must_use]
pub fn windows_var(name: &str, rel: &str) -> Option<PathBuf> {
    std::env::var_os(name).map(|root| PathBuf::from(root).join(rel))
}

/// Joins a Windows env-var-relative path (e.g. `%WINDIR%`). Always `None` on
/// other platforms.
#[cfg(not(target_os = "windows"))]
#[must_use]
pub const fn windows_var(_name: &str, _rel: &str) -> Option<PathBuf> {
    None
}

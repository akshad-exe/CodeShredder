//! Shared, managed application state.

use std::collections::HashSet;
use std::sync::Mutex;

/// State managed by Tauri and shared across commands.
#[derive(Debug, Default)]
pub struct AppState {
    /// Paths a scan has returned to the UI. `cleanup_targets` refuses anything
    /// else, so a bad frontend call cannot delete a folder no scan surfaced.
    allowed: Mutex<HashSet<String>>,
}

impl AppState {
    /// Records paths that a scan just showed the user.
    pub fn allow(&self, paths: impl IntoIterator<Item = String>) {
        if let Ok(mut set) = self.allowed.lock() {
            set.extend(paths);
        }
    }

    /// True when `path` was returned by a scan.
    #[must_use]
    pub fn is_allowed(&self, path: &str) -> bool {
        self.allowed.lock().is_ok_and(|set| set.contains(path))
    }
}

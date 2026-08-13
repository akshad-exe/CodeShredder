//! Shared, managed application state.

use crate::domain::settings::AppSettings;

/// State managed by Tauri and shared across commands.
#[derive(Debug, Default)]
pub struct AppState {
    pub settings: AppSettings,
}

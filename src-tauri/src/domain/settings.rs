//! Application settings persisted across sessions.

use serde::{Deserialize, Serialize};

/// User-facing settings. Mirrors `AppSettings` in the frontend.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub scan_roots: Vec<String>,
    pub enabled_patterns: Vec<String>,
    pub delete_mode: String,
}

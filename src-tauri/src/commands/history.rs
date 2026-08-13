//! History commands exposed to the frontend.

use crate::services::history::{recent_history, HistoryRecord};

/// Returns the most recent cleanup history entries, newest first.
#[tauri::command]
pub fn get_cleanup_history(limit: Option<usize>) -> Vec<HistoryRecord> {
    recent_history(limit.unwrap_or(50))
}

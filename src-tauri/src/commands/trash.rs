//! Recycle Bin / Trash listing and management commands.

use crate::domain::trash::{TrashActionResult, TrashItem};

/// Lists every item currently in the OS Trash / Recycle Bin.
#[tauri::command]
pub fn list_trash() -> Result<Vec<TrashItem>, String> {
    Ok(crate::services::trash::list_items())
}

/// Restores the given trash items (by id) to their original locations.
#[tauri::command]
#[must_use]
#[allow(clippy::needless_pass_by_value)]
pub fn restore_trash(ids: Vec<String>) -> TrashActionResult {
    crate::services::trash::restore_items(&ids)
}

/// Permanently deletes the given trash items (by id).
#[tauri::command]
#[must_use]
#[allow(clippy::needless_pass_by_value)]
pub fn purge_trash(ids: Vec<String>) -> TrashActionResult {
    crate::services::trash::purge_items(&ids)
}

/// Permanently deletes every item in the trash.
#[tauri::command]
#[must_use]
pub fn empty_trash() -> TrashActionResult {
    crate::services::trash::empty_items()
}

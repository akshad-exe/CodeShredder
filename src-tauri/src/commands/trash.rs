//! Recycle Bin / Trash listing and management commands.

use crate::domain::trash::{TrashActionResult, TrashItem};

/// Runs trash I/O off the main thread so a large Trash cannot freeze the window.
async fn blocking<T: Send + 'static>(
    task: impl FnOnce() -> T + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(task)
        .await
        .map_err(|e| e.to_string())
}

/// Lists every item currently in the OS Trash / Recycle Bin.
///
/// # Errors
///
/// Returns `Err(String)` if the background task fails.
#[tauri::command]
pub async fn list_trash() -> Result<Vec<TrashItem>, String> {
    blocking(crate::services::trash::list_items).await
}

/// Restores the given trash items (by id) to their original locations.
///
/// # Errors
///
/// Returns `Err(String)` if the background task fails.
#[tauri::command]
pub async fn restore_trash(ids: Vec<String>) -> Result<TrashActionResult, String> {
    blocking(move || crate::services::trash::restore_items(&ids)).await
}

/// Permanently deletes the given trash items (by id).
///
/// # Errors
///
/// Returns `Err(String)` if the background task fails.
#[tauri::command]
pub async fn purge_trash(ids: Vec<String>) -> Result<TrashActionResult, String> {
    blocking(move || crate::services::trash::purge_items(&ids)).await
}

/// Permanently deletes every item in the trash.
///
/// # Errors
///
/// Returns `Err(String)` if the background task fails.
#[tauri::command]
pub async fn empty_trash() -> Result<TrashActionResult, String> {
    blocking(crate::services::trash::empty_items).await
}

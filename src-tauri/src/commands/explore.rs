//! Commands behind the Explore pages: large files, duplicates and videos.

use crate::domain::explore::{
    DuplicateGroup, DuplicatesInput, LargeFileEntry, LargeFilesInput, VideoEntry, VideosInput,
};
use crate::services::explore;

/// Scans the given roots for the largest files, sorted descending.
///
/// # Errors
///
/// Returns a stringified error when the blocking scan task cannot be spawned.
#[tauri::command]
pub async fn scan_large_files(input: LargeFilesInput) -> Result<Vec<LargeFileEntry>, String> {
    tracing::info!(roots = input.roots.len(), "scan_large_files called");
    tauri::async_runtime::spawn_blocking(move || {
        explore::scan_large_files(&input.roots, input.min_size_bytes, input.limit)
    })
    .await
    .map_err(|e| e.to_string())
}

/// Scans the given roots for groups of content-identical files.
///
/// # Errors
///
/// Returns a stringified error when the blocking scan task cannot be spawned.
#[tauri::command]
pub async fn scan_duplicates(input: DuplicatesInput) -> Result<Vec<DuplicateGroup>, String> {
    tracing::info!(roots = input.roots.len(), "scan_duplicates called");
    tauri::async_runtime::spawn_blocking(move || {
        explore::scan_duplicates(&input.roots, input.min_size_bytes)
    })
    .await
    .map_err(|e| e.to_string())
}

/// Scans the given roots for video files, sorted descending by size.
///
/// # Errors
///
/// Returns a stringified error when the blocking scan task cannot be spawned.
#[tauri::command]
pub async fn scan_videos(input: VideosInput) -> Result<Vec<VideoEntry>, String> {
    tracing::info!(roots = input.roots.len(), "scan_videos called");
    tauri::async_runtime::spawn_blocking(move || {
        explore::scan_videos(&input.roots, input.min_size_bytes)
    })
    .await
    .map_err(|e| e.to_string())
}

//! Commands behind the Explore pages: large files, duplicates and videos.

use crate::domain::explore::{
    DuplicateGroup, DuplicatesInput, LargeFileEntry, LargeFilesInput, VideoEntry, VideosInput,
};
use tauri::State;

use crate::services::explore;
use crate::state::AppState;

/// Scans the given roots for the largest files, sorted descending.
///
/// # Errors
///
/// Returns a stringified error when the blocking scan task cannot be spawned.
#[tauri::command]
pub async fn scan_large_files(
    state: State<'_, AppState>,
    input: LargeFilesInput,
) -> Result<Vec<LargeFileEntry>, String> {
    tracing::info!(roots = input.roots.len(), "scan_large_files called");
    tauri::async_runtime::spawn_blocking(move || {
        explore::scan_large_files(&input.roots, input.min_size_bytes, input.limit)
    })
    .await
    .map_err(|e| e.to_string())
    .inspect(|files| state.allow(files.iter().map(|f| f.path.clone())))
}

/// Scans the given roots for groups of content-identical files.
///
/// # Errors
///
/// Returns a stringified error when the blocking scan task cannot be spawned.
#[tauri::command]
pub async fn scan_duplicates(
    state: State<'_, AppState>,
    input: DuplicatesInput,
) -> Result<Vec<DuplicateGroup>, String> {
    tracing::info!(roots = input.roots.len(), "scan_duplicates called");
    tauri::async_runtime::spawn_blocking(move || {
        explore::scan_duplicates(&input.roots, input.min_size_bytes)
    })
    .await
    .map_err(|e| e.to_string())
    .inspect(|groups| {
        state.allow(
            groups
                .iter()
                .flat_map(|g| g.files.iter().map(|f| f.path.clone())),
        );
    })
}

/// Scans the given roots for video files, sorted descending by size.
///
/// # Errors
///
/// Returns a stringified error when the blocking scan task cannot be spawned.
#[tauri::command]
pub async fn scan_videos(
    state: State<'_, AppState>,
    input: VideosInput,
) -> Result<Vec<VideoEntry>, String> {
    tracing::info!(roots = input.roots.len(), "scan_videos called");
    tauri::async_runtime::spawn_blocking(move || {
        explore::scan_videos(&input.roots, input.min_size_bytes)
    })
    .await
    .map_err(|e| e.to_string())
    .inspect(|videos| state.allow(videos.iter().map(|v| v.path.clone())))
}

//! Cache-related commands exposed to the frontend.

use crate::domain::caches::{CacheCleanResult, CacheEntry};
use crate::services::caches;

/// Lists every present global package-manager cache with its current size.
///
/// Sizing large caches (npm, cargo, go) can take a moment, so the walk runs
/// on a blocking thread and the UI stays responsive.
#[tauri::command]
pub async fn list_caches() -> Vec<CacheEntry> {
    tracing::info!("list_caches called");
    tauri::async_runtime::spawn_blocking(caches::list_caches)
        .await
        .unwrap_or_default()
}

/// Cleans the given caches by id, emptying each one's contents.
///
/// Each id is re-resolved from the known cache specs (never trusted blindly),
/// protected paths are refused, and the directory itself is kept so configs
/// and env vars that point at it keep resolving.
#[tauri::command]
pub async fn clean_caches(ids: Vec<String>) -> Vec<CacheCleanResult> {
    tracing::info!(count = ids.len(), "clean_caches called");
    tauri::async_runtime::spawn_blocking(move || {
        ids.iter()
            .map(|id| {
                match caches::clean_cache(id) {
                    Ok((path, freed_bytes)) => CacheCleanResult {
                        id: id.clone(),
                        path: path.to_string_lossy().into_owned(),
                        freed_bytes,
                        error: None,
                    },
                    Err(error) => CacheCleanResult {
                        id: id.clone(),
                        path: String::new(),
                        freed_bytes: 0,
                        error: Some(error),
                    },
                }
            })
            .collect()
    })
    .await
    .unwrap_or_default()
}

//! Cache-related commands exposed to the frontend.

use crate::domain::caches::CacheEntry;
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

//! Cleanup commands exposed to the frontend.

use std::path::PathBuf;

/// Input to a cleanup run: the absolute paths of the selected targets.
#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanInput {
    pub paths: Vec<String>,
}

/// Per-target outcome returned to the frontend.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanResult {
    pub total: usize,
    pub trashed: usize,
    pub failed: usize,
    pub errors: Vec<CleanError>,
}

/// A single failed path and the reason it could not be trashed.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanError {
    pub path: String,
    pub error: String,
}

/// Moves the given folders to the OS Trash / Recycle Bin.
///
/// Uses the `trash` crate so nothing is permanently destroyed: every target is
/// recoverable from the operating system's trash.
#[tauri::command]
pub async fn cleanup_targets(input: CleanInput) -> CleanResult {
    let mut errors = Vec::new();
    let mut trashed = 0usize;

    for raw in &input.paths {
        let path = PathBuf::from(raw);
        match trash::delete(&path) {
            Ok(()) => trashed += 1,
            Err(err) => errors.push(CleanError {
                path: raw.clone(),
                error: err.to_string(),
            }),
        }
    }

    let total = input.paths.len();
    tracing::info!(
        total,
        trashed,
        failed = errors.len(),
        "cleanup_targets completed"
    );

    CleanResult {
        total,
        trashed,
        failed: errors.len(),
        errors,
    }
}

//! Cleanup commands exposed to the frontend.
//!
//! A cleanup run applies the safety engine before touching anything: protected
//! paths are always rejected, and the requested mode decides between moving to
//! the trash (default, recoverable) and permanent deletion (last resort).

use std::path::PathBuf;

use crate::domain::clean::{CleanError, CleanInput, CleanMode, CleanResult};
use crate::services::history::{record_history, HistoryEntry};
use crate::services::safety::is_protected;

/// Runs a cleanup over the selected paths.
///
/// Every path is checked against the protected list first — anything that
/// resolves into a system or home root is refused even if it somehow reached
/// this command. The mode then decides how (or whether) the folder is removed.
#[tauri::command]
pub async fn cleanup_targets(input: CleanInput) -> CleanResult {
    let mode = input.mode.unwrap_or_default();
    let mut errors = Vec::new();
    let mut affected = 0usize;

    for raw in &input.paths {
        let path = PathBuf::from(raw);

        // Never act on protected paths, whatever the mode.
        if is_protected(&path) {
            errors.push(CleanError {
                path: raw.clone(),
                error: "path is protected and cannot be cleaned".into(),
            });
            continue;
        }

        match mode {
            CleanMode::Trash => match trash::delete(&path) {
                Ok(()) => affected += 1,
                Err(err) => errors.push(CleanError {
                    path: raw.clone(),
                    error: err.to_string(),
                }),
            },
            CleanMode::Permanent => match remove_permanently(&path) {
                Ok(()) => affected += 1,
                Err(err) => errors.push(CleanError {
                    path: raw.clone(),
                    error: err.to_string(),
                }),
            },
        }
    }

    let total = input.paths.len();
    let result = CleanResult {
        total,
        affected,
        failed: errors.len(),
        mode: mode.to_string(),
        errors,
    };

    if let Err(err) = record_history(HistoryEntry {
        mode,
        paths: input.paths.clone(),
        affected,
        failed: result.failed,
        total,
    }) {
        tracing::warn!(error = %err, "could not record cleanup history");
    }

    tracing::info!(
        mode = %mode,
        total,
        affected,
        failed = result.failed,
        "cleanup_targets completed"
    );

    result
}

/// Permanently removes `path` from disk. Only used when the user explicitly
/// opts into permanent deletion; everything else goes through the Trash.
fn remove_permanently(path: &PathBuf) -> std::io::Result<()> {
    if path.is_dir() {
        std::fs::remove_dir_all(path)
    } else {
        std::fs::remove_file(path)
    }
}

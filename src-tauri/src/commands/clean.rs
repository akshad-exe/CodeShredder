//! Cleanup commands exposed to the frontend.
//!
//! A cleanup run applies the safety engine before touching anything: protected
//! paths are always rejected, and the requested mode decides between moving to
//! the trash (default, recoverable) and permanent deletion (last resort).

use std::path::{Path, PathBuf};

use tauri::Manager;

use crate::domain::clean::{CleanError, CleanInput, CleanMode, CleanResult};
use crate::services::history::{record_history, HistoryEntry};
use crate::services::safety::is_protected;
use crate::state::AppState;

/// Runs a cleanup over the selected paths.
///
/// Every path is checked against the protected list first — anything that
/// resolves into a system or home root is refused even if it somehow reached
/// this command. The mode then decides how (or whether) the folder is removed.
#[tauri::command]
pub async fn cleanup_targets(app: tauri::AppHandle, input: CleanInput) -> CleanResult {
    let total = input.paths.len();
    let mode = input.mode.unwrap_or_default();
    tauri::async_runtime::spawn_blocking(move || {
        run_cleanup(input, |path| app.state::<AppState>().is_allowed(path))
    })
    .await
    .unwrap_or_else(|err| CleanResult {
        total,
        affected: 0,
        failed: total,
        mode: mode.to_string(),
        errors: vec![CleanError {
            path: String::new(),
            error: err.to_string(),
        }],
    })
}

/// Core of [`cleanup_targets`]: paths that `is_allowed` rejects (never shown
/// by a scan) are refused like protected ones.
fn run_cleanup(input: CleanInput, is_allowed: impl Fn(&str) -> bool) -> CleanResult {
    let mode = input.mode.unwrap_or_default();
    let mut errors = Vec::new();
    let mut affected = 0usize;

    for raw in &input.paths {
        let path = PathBuf::from(raw);

        if !is_allowed(raw) {
            errors.push(CleanError {
                path: raw.clone(),
                error: "path was not returned by a scan".into(),
            });
            continue;
        }

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
        paths: input.paths,
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
fn remove_permanently(path: &Path) -> std::io::Result<()> {
    if path.is_dir() {
        std::fs::remove_dir_all(path)
    } else {
        std::fs::remove_file(path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input(paths: Vec<String>) -> CleanInput {
        CleanInput {
            paths,
            mode: Some(CleanMode::Permanent),
        }
    }

    #[test]
    fn deletes_allowed_path_and_refuses_the_rest() {
        let base = std::env::temp_dir().join(format!("cs-clean-test-{}", std::process::id()));
        let allowed = base.join("node_modules");
        let other = base.join("keep");
        std::fs::create_dir_all(&allowed).unwrap();
        std::fs::create_dir_all(&other).unwrap();
        let allowed_s = allowed.to_string_lossy().into_owned();

        let result = run_cleanup(
            input(vec![
                allowed_s.clone(),
                other.to_string_lossy().into_owned(),
            ]),
            |p| p == allowed_s,
        );

        assert_eq!((result.affected, result.failed), (1, 1));
        assert!(!allowed.exists());
        assert!(other.exists());
        let _ = std::fs::remove_dir_all(&base);
    }

    #[test]
    fn refuses_protected_path_even_if_allowed() {
        let result = run_cleanup(input(vec!["/usr/bin".into()]), |_| true);
        assert_eq!((result.affected, result.failed), (0, 1));
    }
}

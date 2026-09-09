//! Scan commands exposed to the frontend.

use std::sync::mpsc::{self, RecvTimeoutError};
use std::time::Duration;

use tauri::Emitter;

use crate::domain::scan::{ScanInput, ScanResult, ScanSummary, ScanTarget};
use crate::services::scanner::ScannerEngine;

/// Targets are streamed to the frontend in batches to keep IPC churn flat as
/// the result set grows: a full-size batch is emitted as soon as it fills, and
/// anything collected since the last flush goes out on a time budget so the UI
/// never goes silent while it is still receiving.
const TARGET_BATCH: usize = 25;
const TARGET_FLUSH: Duration = Duration::from_millis(100);

/// Asks the in-progress scan to stop early. Targets already streamed stay
/// visible; the scanner just stops descending into new folders.
#[tauri::command]
pub fn cancel_scan() {
    tracing::info!("cancel_scan called");
    ScannerEngine::request_cancel();
}

/// Scans the given roots for known developer-junk folders.
///
/// The heavy walk runs on rayon's thread pool inside a blocking task, so the
/// UI thread never freezes. Matched targets are emitted as `scan-targets`
/// events in batches (see `TARGET_BATCH`/`TARGET_FLUSH`) the moment they are
/// measured, and a final `scan-complete` event carries the summary so the
/// frontend can finalize its accumulated list.
///
/// # Errors
///
/// Returns `Err(String)` if the scan fails to start or encounters a system error.
#[tauri::command]
pub async fn scan_dev_folders(
    app: tauri::AppHandle,
    input: ScanInput,
) -> Result<ScanResult, String> {
    tracing::info!(roots = ?input.roots, patterns = ?input.patterns, "scan_dev_folders called");

    let (tx, rx) = mpsc::channel::<ScanTarget>();

    let app_for_events = app.clone();
    let scan_app = app.clone();
    let scan_input = input.clone();

    let scan_task = tauri::async_runtime::spawn_blocking(move || {
        let duration = ScannerEngine::scan_stream(&scan_input, &tx);
        drop(tx);
        duration
    });

    let emit_task = tauri::async_runtime::spawn_blocking(move || {
        let mut targets = Vec::new();
        let mut total_size = 0u64;
        let mut batch = Vec::new();
        loop {
            match rx.recv_timeout(TARGET_FLUSH) {
                Ok(target) => {
                    total_size += target.size_bytes;
                    batch.push(target.clone());
                    targets.push(target);
                    if batch.len() >= TARGET_BATCH {
                        let _ = app_for_events.emit("scan-targets", &batch);
                        batch.clear();
                    }
                }
                Err(RecvTimeoutError::Timeout) => {
                    if !batch.is_empty() {
                        let _ = app_for_events.emit("scan-targets", &batch);
                        batch.clear();
                    }
                }
                Err(RecvTimeoutError::Disconnected) => {
                    if !batch.is_empty() {
                        let _ = app_for_events.emit("scan-targets", &batch);
                    }
                    break;
                }
            }
        }
        (targets, total_size)
    });

    let scan_duration = scan_task.await.map_err(|e| e.to_string())?;
    let (mut targets, total_size) = emit_task.await.map_err(|e| e.to_string())?;

    targets.sort_by_key(|b| std::cmp::Reverse(b.size_bytes));
    let total_count = targets.len() as u64;

    let result = ScanResult {
        targets,
        total_size,
        total_count,
        scan_duration,
    };

    let summary = ScanSummary {
        total_size,
        total_count,
        scan_duration,
    };

    tracing::info!(
        total_count,
        total_size,
        scan_duration,
        "scan_dev_folders completed"
    );
    // Targets were already streamed in `scan-targets` batches; the completion
    // event only carries the summary so the frontend finalizes its accumulated
    // list instead of receiving every target a second time.
    let _ = scan_app.emit("scan-complete", &summary);
    Ok(result)
}

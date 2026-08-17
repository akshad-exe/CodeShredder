//! Scan commands exposed to the frontend.

use std::sync::mpsc;

use tauri::Emitter;

use crate::domain::scan::{ScanInput, ScanResult, ScanTarget};
use crate::services::scanner::ScannerEngine;

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
/// UI thread never freezes. Every matched target is emitted as a `scan-target`
/// event the moment it is measured, and a final `scan-complete` event carries
/// the full, size-sorted result.
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
        while let Ok(target) = rx.recv() {
            total_size += target.size_bytes;
            let _ = app_for_events.emit("scan-target", &target);
            targets.push(target);
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

    tracing::info!(
        total_count,
        total_size,
        scan_duration,
        "scan_dev_folders completed"
    );
    let _ = scan_app.emit("scan-complete", &result);
    Ok(result)
}

//! WSL commands exposed to the frontend.
//!
//! Every command is `async` and runs its work on a blocking thread so the UI
//! stays responsive while `wsl.exe` / `diskpart` run (which can take minutes).
//! Long-running commands accept a [`tauri::ipc::Channel`] that streams progress
//! events back to the frontend as steps complete.

use tauri::ipc::Channel;

use crate::domain::wsl::{WslCleanupResult, WslCompactResult, WslDistro, WslProgress};
use crate::services::wsl;

/// Lists installed WSL distros with their running state and virtual disk
/// details. Empty on platforms without WSL.
#[tauri::command]
pub async fn list_wsl_distros() -> Vec<WslDistro> {
    tracing::info!("list_wsl_distros called");
    tauri::async_runtime::spawn_blocking(wsl::list_distros)
        .await
        .unwrap_or_else(|_| Ok(Vec::new()))
        .unwrap_or_default()
}

/// Shuts down every running WSL distro (required before compacting disks).
#[tauri::command]
pub async fn wsl_shutdown(on_event: Channel<WslProgress>) -> Result<(), String> {
    tracing::info!("wsl_shutdown called");
    let _ = on_event.send(WslProgress {
        operation: "shutdown".to_string(),
        level: "info".to_string(),
        step: "Shutting down all WSL distros…".to_string(),
    });
    tauri::async_runtime::spawn_blocking(wsl::shutdown_all)
        .await
        .map_err(|e| e.to_string())?
}

/// Compacts a distro's virtual disk and reports the reclaimed space, streaming
/// each phase (shutdown → locate disk → diskpart) as it happens.
#[tauri::command]
pub async fn wsl_compact(
    distro: String,
    on_event: Channel<WslProgress>,
) -> WslCompactResult {
    tracing::info!(distro, "wsl_compact called");
    let distro_for_closure = distro.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let mut on_progress = |p: WslProgress| {
            let _ = on_event.send(p);
        };
        wsl::compact_distro(&distro_for_closure, &mut on_progress)
    })
    .await
    .unwrap_or_else(|_| WslCompactResult {
        distro,
        before_bytes: None,
        after_bytes: None,
        freed_bytes: None,
        error: Some("Compaction was cancelled".to_string()),
    })
}

/// Runs a cleanup command inside a distro and returns its output, streaming
/// progress as the command starts and finishes.
#[tauri::command]
pub async fn wsl_run_cleanup(
    distro: String,
    commands: String,
    on_event: Channel<WslProgress>,
) -> WslCleanupResult {
    tracing::info!(distro, "wsl_run_cleanup called");
    let distro_for_closure = distro.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let mut on_progress = |p: WslProgress| {
            let _ = on_event.send(p);
        };
        wsl::run_cleanup(&distro_for_closure, &commands, &mut on_progress)
    })
    .await
    .unwrap_or_else(|_| WslCleanupResult {
        distro,
        success: false,
        output: "Cleanup was cancelled".to_string(),
    })
}

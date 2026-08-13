//! WSL commands exposed to the frontend.

use crate::domain::wsl::{WslCleanupResult, WslCompactResult, WslDistro};
use crate::services::wsl;

/// Lists installed WSL distros with their running state and virtual disk
/// details. Empty on platforms without WSL.
#[tauri::command]
pub fn list_wsl_distros() -> Vec<WslDistro> {
    tracing::info!("list_wsl_distros called");
    wsl::list_distros().unwrap_or_default()
}

/// Shuts down every running WSL distro (required before compacting disks).
#[tauri::command]
pub fn wsl_shutdown() -> Result<(), String> {
    tracing::info!("wsl_shutdown called");
    wsl::shutdown_all()
}

/// Compacts a distro's virtual disk and reports the reclaimed space.
#[tauri::command]
pub fn wsl_compact(distro: String) -> WslCompactResult {
    tracing::info!(distro, "wsl_compact called");
    wsl::compact_distro(&distro)
}

/// Runs a cleanup command inside a distro and returns its output.
#[tauri::command]
pub fn wsl_run_cleanup(distro: String, commands: String) -> WslCleanupResult {
    tracing::info!(distro, "wsl_run_cleanup called");
    wsl::run_cleanup(&distro, &commands)
}

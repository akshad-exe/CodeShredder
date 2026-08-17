//! Tauri application wiring: plugins, managed state and commands.

use crate::error::Result;
use crate::state::AppState;

/// Builds and runs the desktop application.
///
/// # Errors
///
/// Returns an error if the Tauri builder cannot initialize the window or
/// plugins.
#[allow(clippy::large_stack_frames)]
pub fn run() -> Result<()> {
    // Initialize tracing for debug logs
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            crate::commands::scan::scan_dev_folders,
            crate::commands::scan::cancel_scan,
            crate::commands::clean::cleanup_targets,
            crate::commands::history::get_cleanup_history,
            crate::commands::caches::list_caches,
            crate::commands::caches::clean_caches,
            crate::commands::trash::list_trash,
            crate::commands::trash::restore_trash,
            crate::commands::trash::purge_trash,
            crate::commands::trash::empty_trash,
            crate::commands::wsl::list_wsl_distros,
            crate::commands::wsl::wsl_shutdown,
            crate::commands::wsl::wsl_compact,
            crate::commands::wsl::wsl_run_cleanup
        ])
        .build(tauri::generate_context!())?;

    app.run(|_app_handle, _event| {});

    Ok(())
}

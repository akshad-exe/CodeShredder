//! `CodeShredder` - Fast, safe desktop cleanup for developers
//!
//! This is the main library crate for the Tauri application.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod app;
pub mod commands;
pub mod domain;
pub mod error;
pub mod platform;
pub mod services;
pub mod state;
pub mod storage;
pub mod utils;

use crate::error::Result;

/// Runs the Tauri application.
///
/// # Errors
///
/// Returns an error when the application fails to start, such as an invalid
/// Tauri configuration or a failed system-initialization step.
pub fn run() -> Result<()> {
    app::run()
}

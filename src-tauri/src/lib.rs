//! CodeShredder - Fast, safe desktop cleanup for developers
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

pub fn run() -> Result<()> {
    app::run()
}
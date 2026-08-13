//! Cleanup history: persists a record of every cleanup run to a JSON file in
//! the user's app-data directory so the UI can show what was cleaned and when.
//!
//! This is a lightweight, append-style journal. A full database (SQLite) is
//! planned for later milestones — the file format is kept trivially compatible
//! so it can be migrated.

use std::fs;
use std::path::PathBuf;

use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::domain::clean::CleanMode;

/// Maximum number of history entries kept on disk.
const MAX_ENTRIES: usize = 200;

/// A single cleanup run, recorded after the fact.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub mode: CleanMode,
    pub paths: Vec<String>,
    pub affected: usize,
    pub failed: usize,
    pub total: usize,
}

/// Full journal on disk.
#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupHistory {
    pub entries: Vec<HistoryRecord>,
}

/// A stored history record with its timestamp.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryRecord {
    pub timestamp: String,
    pub mode: CleanMode,
    pub paths: Vec<String>,
    pub affected: usize,
    pub failed: usize,
    pub total: usize,
}

/// Appends an entry to the history journal.
pub fn record_history(entry: HistoryEntry) -> crate::error::Result<()> {
    let mut history = load_history();
    history.entries.push(HistoryRecord {
        timestamp: Utc::now().to_rfc3339(),
        mode: entry.mode,
        paths: entry.paths,
        affected: entry.affected,
        failed: entry.failed,
        total: entry.total,
    });

    // Keep the journal bounded.
    if history.entries.len() > MAX_ENTRIES {
        let overflow = history.entries.len() - MAX_ENTRIES;
        history.entries.drain(..overflow);
    }

    let file = history_file()?;
    if let Some(dir) = file.parent() {
        fs::create_dir_all(dir)?;
    }
    let json = serde_json::to_string_pretty(&history)?;
    fs::write(file, json)?;
    Ok(())
}

/// Loads the history journal, tolerating a missing or corrupt file.
pub fn load_history() -> CleanupHistory {
    let Ok(file) = history_file() else {
        return CleanupHistory::default();
    };
    let Ok(raw) = fs::read_to_string(file) else {
        return CleanupHistory::default();
    };
    serde_json::from_str(&raw).unwrap_or_default()
}

/// Returns the newest N history records (most recent first).
pub fn recent_history(limit: usize) -> Vec<HistoryRecord> {
    let mut history = load_history();
    history.entries.reverse();
    history.entries.truncate(limit);
    history.entries
}

/// Resolves the history file path inside the app-data directory.
fn history_file() -> crate::error::Result<PathBuf> {
    let dirs = directories::ProjectDirs::from("dev", "Akshad", "CodeShredder")
        .ok_or_else(|| crate::error::Error::msg("could not resolve app data directory"))?;
    Ok(dirs.data_dir().join("history.json"))
}

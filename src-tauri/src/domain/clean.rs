//! Cleanup input and result models shared with the frontend.

use std::fmt;

use serde::{Deserialize, Serialize};

/// How a cleanup run should treat its targets.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum CleanMode {
    /// Move targets to the OS Trash / Recycle Bin (default, recoverable).
    #[default]
    Trash,
    /// Permanently delete targets from disk. Last resort, heavily confirmed.
    Permanent,
}

impl fmt::Display for CleanMode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            Self::Trash => "trash",
            Self::Permanent => "permanent",
        };
        f.write_str(s)
    }
}

impl std::str::FromStr for CleanMode {
    type Err = String;

    fn from_str(raw: &str) -> Result<Self, Self::Err> {
        match raw {
            "trash" => Ok(Self::Trash),
            "permanent" => Ok(Self::Permanent),
            other => Err(format!("unknown cleanup mode: {other}")),
        }
    }
}

/// Input to a cleanup run: the absolute paths of the selected targets and the
/// mode to run in.
#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanInput {
    pub paths: Vec<String>,
    pub mode: Option<CleanMode>,
}

/// Per-target outcome returned to the frontend.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanResult {
    pub total: usize,
    /// Number of paths that were affected (trashed, deleted or simulated).
    pub affected: usize,
    pub failed: usize,
    pub mode: String,
    pub errors: Vec<CleanError>,
}

/// A single failed path and the reason it could not be cleaned.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanError {
    pub path: String,
    pub error: String,
}

//! Scan input and result models shared with the frontend.

use serde::{Deserialize, Serialize};

/// Safety classification for a cleanup target.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SafetyLevel {
    Safe,
    Medium,
    Dangerous,
}

/// Input to a scan run.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanInput {
    pub roots: Vec<String>,
    pub patterns: Vec<String>,
    /// Folder names or path fragments the scan must skip entirely. A rule with
    /// a path separator is matched as a substring of the full path; any other
    /// rule matches a folder name (case-insensitive).
    #[serde(default)]
    pub ignore: Vec<String>,
}

/// A single discovered cleanup target.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanTarget {
    pub id: String,
    pub path: String,
    pub display_path: String,
    pub project_name: String,
    /// Full path of the owning project root. Distinct from `project_name`
    /// because projects with the same name can live under different roots.
    pub project_path: String,
    pub folder_name: String,
    pub category: String,
    pub size_bytes: u64,
    pub file_count: u64,
    pub last_modified: Option<String>,
    pub safety_level: SafetyLevel,
    pub selected: bool,
}

/// Full result of a scan run.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub targets: Vec<ScanTarget>,
    pub total_size: u64,
    pub total_count: u64,
    pub scan_duration: f64,
}

/// Lean summary sent with the final `scan-complete` event. The targets
/// themselves were already streamed in `scan-targets` batches, so they are not
/// repeated here.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanSummary {
    pub total_size: u64,
    pub total_count: u64,
    pub scan_duration: f64,
}

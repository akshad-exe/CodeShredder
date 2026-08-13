//! Recycle Bin item and action-result types exchanged with the frontend.

use serde::{Deserialize, Serialize};

/// A single item currently in the OS trash / Recycle Bin.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrashItem {
    pub id: String,
    pub name: String,
    pub original_path: String,
    pub original_parent: String,
    pub time_deleted: i64,
    pub size_bytes: Option<u64>,
    pub entries: Option<usize>,
}

/// Aggregate result of a restore / purge / empty operation.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrashActionResult {
    pub total: usize,
    pub succeeded: usize,
    pub failed: usize,
    pub errors: Vec<String>,
}

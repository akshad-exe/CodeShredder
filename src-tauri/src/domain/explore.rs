//! Models for the Explore pages: large files, duplicates and videos.

use serde::{Deserialize, Serialize};

/// Input to the large-files scan.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LargeFilesInput {
    pub roots: Vec<String>,
    #[serde(default)]
    pub min_size_bytes: u64,
    /// Maximum number of entries to return, largest first. Helps keep IPC
    /// payloads bounded when scanning very large roots.
    #[serde(default = "default_limit")]
    pub limit: usize,
}

/// Input to the duplicate scan.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DuplicatesInput {
    pub roots: Vec<String>,
    #[serde(default)]
    pub min_size_bytes: u64,
}

/// Input to the video scan.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideosInput {
    pub roots: Vec<String>,
    #[serde(default)]
    pub min_size_bytes: u64,
}

const fn default_limit() -> usize {
    500
}

/// A single file surfaced by the large-files scan.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LargeFileEntry {
    pub id: String,
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub modified_at: Option<String>,
    /// Lower-case extension without the dot, e.g. `zip`.
    pub ext: String,
}

/// One member of a duplicate group.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DuplicateFile {
    pub id: String,
    pub path: String,
    pub name: String,
    pub modified_at: Option<String>,
}

/// A set of files whose contents match exactly, all the same size.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DuplicateGroup {
    pub id: String,
    /// Size in bytes shared by every member of the group.
    pub size_bytes: u64,
    pub files: Vec<DuplicateFile>,
}

/// A single video file surfaced by the video scan.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoEntry {
    pub id: String,
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    /// Lower-case extension without the dot, e.g. `mkv`.
    pub ext: String,
    /// Runtime in seconds, when the container metadata was parseable.
    pub duration_sec: Option<u64>,
}

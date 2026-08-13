//! Persistent folder-size cache (`scan-cache.json`).
//!
//! When a scan re-finds a target folder whose directory metadata is
//! unchanged since the last measurement, the cached size and file count are
//! reused instead of walking the tree again. This makes repeat scans of
//! untouched projects near-instant.

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};

/// A single cached measurement keyed by the target folder's absolute path.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheEntry {
    pub size_bytes: u64,
    pub file_count: u64,
    /// RFC 3339 timestamp of the newest file under the target when it was
    /// measured. Replayed to the UI on a cache hit.
    pub last_modified: String,
    /// RFC 3339 timestamp of the target directory's own metadata when it was
    /// measured. If this matches on a later scan the entry is still valid.
    pub dir_mtime: String,
    /// RFC 3339 timestamp of when the measurement was taken.
    pub measured_at: String,
}

/// The on-disk scan cache. Serialized to `scan-cache.json` in the app data
/// directory and never sent to the frontend.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ScanCache {
    #[serde(default)]
    pub entries: HashMap<String, CacheEntry>,
}

impl ScanCache {
    /// Path of the cache file inside the per-user app data directory.
    pub fn cache_path() -> Option<PathBuf> {
        ProjectDirs::from("com", "akshad", "CodeShredder")
            .map(|dirs| dirs.data_dir().join("scan-cache.json"))
    }

    /// Loads the cache from disk, returning an empty cache if it is missing or
    /// unreadable. A corrupt file is discarded rather than failing the scan.
    pub fn load() -> Self {
        let Some(path) = Self::cache_path() else {
            return Self::default();
        };
        match fs::read(&path) {
            Ok(bytes) => serde_json::from_slice(&bytes).unwrap_or_default(),
            Err(_) => Self::default(),
        }
    }

    /// Writes the cache back to disk, creating the data directory as needed.
    pub fn save(&self) {
        let Some(path) = Self::cache_path() else {
            return;
        };
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        if let Ok(json) = serde_json::to_string(self) {
            let _ = fs::write(&path, json);
        }
    }

    /// Returns the cached entry for `path` if it exists and the target
    /// directory's mtime is still unchanged since it was measured.
    pub fn hit(&self, path: &Path, dir_mtime: SystemTime) -> Option<&CacheEntry> {
        let key = path.to_string_lossy();
        let entry = self.entries.get(key.as_ref())?;
        let cached = format_time(dir_mtime);
        if entry.dir_mtime == cached {
            Some(entry)
        } else {
            None
        }
    }

    /// Stores a measurement for `path`.
    pub fn insert(&mut self, path: &Path, entry: CacheEntry) {
        self.entries
            .insert(path.to_string_lossy().into_owned(), entry);
    }
}

fn format_time(time: SystemTime) -> String {
    let dt: chrono::DateTime<chrono::Local> = time.into();
    dt.to_rfc3339_opts(chrono::SecondsFormat::Nanos, true)
}

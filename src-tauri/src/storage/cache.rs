//! Persistent scan cache (`scan-cache.json`).
//!
//! Two layers of reuse, both keyed on directory metadata so repeat scans of
//! untouched folders are near-instant:
//!
//! - A per-root **discovery snapshot**: the mtime fingerprint of every
//!   directory walked under a root, plus the targets found there. When the
//!   fingerprint matches on a later scan the target list is replayed without
//!   re-walking or re-measuring anything.
//! - A per-target **size cache**: measured size/file-count of a target folder,
//!   reused when that folder's own metadata is unchanged.

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};

/// A single directory visited during a scan, stamped with its mtime.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DirStamp {
    pub path: String,
    /// Directory mtime as nanoseconds since the Unix epoch. Used purely for
    /// comparison, never displayed.
    pub mtime_nanos: u128,
}

/// A measured target as stored in a discovery snapshot. The path-derived
/// display fields are recomputed on replay, so only the raw facts are kept.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct StoredTarget {
    pub path: String,
    pub folder_name: String,
    pub size_bytes: u64,
    pub file_count: u64,
    pub last_modified: Option<String>,
}

/// A full discovery snapshot for one scan root.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RootSnapshot {
    /// Fingerprint of every directory walked under the root, sorted by path so
    /// equality is order-independent.
    pub fingerprint: Vec<DirStamp>,
    /// Targets discovered under this root during the scan that produced the
    /// fingerprint.
    #[serde(default)]
    pub targets: Vec<StoredTarget>,
    /// Effective pattern set (sorted) used when the fingerprint was captured.
    /// The fingerprint alone is ambiguous across scans: pruning is identical
    /// whether venv folders are enabled or not, so replay is only valid when
    /// the pattern set is unchanged too.
    #[serde(default)]
    pub patterns: Vec<String>,
}

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
    /// Per-target size measurements, keyed by absolute target path.
    #[serde(default)]
    pub entries: HashMap<String, CacheEntry>,
    /// Per-root discovery snapshots, keyed by absolute root path.
    #[serde(default)]
    pub snapshots: HashMap<String, RootSnapshot>,
}

impl ScanCache {
    /// Path of the cache file inside the per-user app data directory. Overridable
    /// via `CODE_SHREDDER_CACHE` (used by tests to isolate their cache).
    pub fn cache_path() -> Option<PathBuf> {
        if let Ok(override_path) = std::env::var("CODE_SHREDDER_CACHE") {
            return Some(PathBuf::from(override_path));
        }
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

    /// Returns the discovery snapshot for `root`, if one exists.
    pub fn snapshot(&self, root: &str) -> Option<&RootSnapshot> {
        self.snapshots.get(root)
    }

    /// Stores a discovery snapshot for `root`.
    pub fn insert_snapshot(&mut self, root: &str, snapshot: RootSnapshot) {
        self.snapshots.insert(root.to_string(), snapshot);
    }
}

fn format_time(time: SystemTime) -> String {
    let dt: chrono::DateTime<chrono::Local> = time.into();
    dt.to_rfc3339_opts(chrono::SecondsFormat::Nanos, true)
}

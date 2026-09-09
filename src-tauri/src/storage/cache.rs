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
//!   reused when that folder's own metadata is unchanged *and* the measurement
//!   is still within `MEASURE_TTL`.
//!
//! Per-directory target stamps (for structure-level revalidation without file
//! stats) were drafted for this layer but measured as unaffordable in JSON:
//! they grow the cache to multi-MB (regressing warm scans ~2.3x). They return
//! once the cache moves to a compact binary format (see the storage plan).

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime};

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};

/// A cached measurement is trusted for this long after it was taken.
///
/// Directory mtimes miss same-size content edits (and nanosecond evidence is
/// sometimes lost on NTFS), so the TTL bounds how stale a replayed size can
/// be: after it lapses the target is re-measured even if its metadata looks
/// unchanged.
pub const MEASURE_TTL: Duration = Duration::from_hours(7 * 24);

/// A single directory visited during a scan, stamped with its mtime. The path
/// is absolute in root fingerprints and relative (to the target) in a
/// `CacheEntry`'s stamp set.
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
    /// Effective ignore rules (sorted) used when the fingerprint was captured.
    /// Ignoring a folder that is otherwise pruned (e.g. a target name) does not
    /// change the walked set, so the rules themselves must be part of the
    /// snapshot identity.
    #[serde(default)]
    pub ignore: Vec<String>,
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
    #[must_use]
    pub fn cache_path() -> Option<PathBuf> {
        if let Ok(override_path) = std::env::var("CODE_SHREDDER_CACHE") {
            return Some(PathBuf::from(override_path));
        }
        ProjectDirs::from("com", "akshad", "CodeShredder")
            .map(|dirs| dirs.data_dir().join("scan-cache.json"))
    }

    /// Loads the cache from disk, returning an empty cache if it is missing or
    /// unreadable. A corrupt file is discarded rather than failing the scan.
    #[must_use]
    pub fn load() -> Self {
        let Some(path) = Self::cache_path() else {
            return Self::default();
        };
        fs::read(&path).map_or_else(
            |_| Self::default(),
            |bytes| serde_json::from_slice(&bytes).unwrap_or_default(),
        )
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

    /// Returns the cached entry for `path` if it exists, the target
    /// directory's mtime is still unchanged since it was measured, and the
    /// measurement is still within `MEASURE_TTL`. An expired measurement is
    /// not replayed even when the mtime matches.
    #[must_use]
    pub fn hit(&self, path: &Path, dir_mtime: SystemTime, now: SystemTime) -> Option<&CacheEntry> {
        let key = path.to_string_lossy();
        let entry = self.entries.get(key.as_ref())?;
        if entry.dir_mtime == format_time(dir_mtime) && is_fresh(entry, now) {
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
    #[must_use]
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

/// True when `now` is within `MEASURE_TTL` of when the entry was measured. An
/// unparsable timestamp counts as expired so a corrupt clock never pins a
/// measurement forever.
fn is_fresh(entry: &CacheEntry, now: SystemTime) -> bool {
    parse_time(&entry.measured_at).is_some_and(|at| {
        now.duration_since(at)
            .map_or(true, |age| age <= MEASURE_TTL)
    })
}

fn parse_time(value: &str) -> Option<SystemTime> {
    chrono::DateTime::parse_from_rfc3339(value)
        .ok()
        .map(|dt| dt.to_utc().into())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(measured_at: SystemTime) -> CacheEntry {
        CacheEntry {
            size_bytes: 100,
            file_count: 3,
            last_modified: "last".into(),
            dir_mtime: "dir".into(),
            measured_at: format_time(measured_at),
        }
    }

    fn old_cache(dir_mtime: SystemTime, measured_at: SystemTime) -> ScanCache {
        let mut cache = ScanCache::default();
        let mut e = entry(measured_at);
        e.dir_mtime = format_time(dir_mtime);
        cache.insert(Path::new("/tmp/target"), e);
        cache
    }

    const DAY: Duration = Duration::from_hours(24);
    const WEEK: Duration = Duration::from_hours(7 * 24);

    fn now() -> SystemTime {
        SystemTime::now()
    }

    #[test]
    fn hit_replays_fresh_unchanged_entry() {
        let mtime = now();
        let cache = old_cache(mtime, now());
        assert!(cache.hit(Path::new("/tmp/target"), mtime, now()).is_some());
    }

    #[test]
    fn hit_ignores_stale_measurement() {
        let mtime = now();
        let cache = old_cache(mtime, now() - WEEK - DAY);
        assert!(cache.hit(Path::new("/tmp/target"), mtime, now()).is_none());
    }

    #[test]
    fn hit_ignores_changed_dir_mtime() {
        let cache = old_cache(now(), now());
        assert!(cache
            .hit(Path::new("/tmp/target"), now() + DAY, now())
            .is_none());
    }
}

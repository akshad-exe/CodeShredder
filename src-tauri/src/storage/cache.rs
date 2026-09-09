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

use std::collections::hash_map::DefaultHasher;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime};

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};

use crate::domain::mtime::{format_time, parse_time};

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
    /// When this snapshot was created. Used to enforce `MEASURE_TTL` on replay:
    /// an expired snapshot is not trusted even when its fingerprint still matches.
    /// Missing or unparseable values count as expired so old cache files are
    /// transparently re-measured on first access.
    #[serde(default)]
    pub created_at: String,
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

/// The on-disk scan cache.
///
/// Per-target measurements live in the main `scan-cache.json` document; each
/// root snapshot lives in its own file under a sibling `scan-cache-roots/`
/// directory. A scan therefore rewrites only the roots whose fingerprint
/// actually changed instead of the whole document. Never sent to the frontend.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ScanCache {
    /// Per-target size measurements, keyed by absolute target path.
    #[serde(default)]
    pub entries: HashMap<String, CacheEntry>,
    /// Per-root discovery snapshots, keyed by absolute root path.
    #[serde(default)]
    pub snapshots: HashMap<String, RootSnapshot>,
    /// Root keys whose snapshot changed since `load` and must be persisted.
    /// Roots that only exist inline (a pre-split document) appear here too so
    /// the first `save` migrates them out. Never serialized.
    #[serde(skip)]
    dirty_roots: HashSet<String>,
    /// True when any entry measurement changed since `load`; the main document
    /// is rewritten only then. Never serialized.
    #[serde(skip)]
    entries_dirty: bool,
}

impl ScanCache {
    /// Path of the main cache document inside the per-user app data directory.
    /// Overridable via `CODE_SHREDDER_CACHE` (used by tests to isolate their
    /// cache, and by the benchmark).
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
        Self::cache_path().map_or_else(Self::default, |path| Self::load_from(&path))
    }

    /// Loads the cache from a specific document path (tests and benchmarks
    /// inject it so they never touch the real cache).
    #[must_use]
    pub fn load_from(path: &Path) -> Self {
        let mut cache: Self = fs::read(path).map_or_else(
            |_| Self::default(),
            |bytes| serde_json::from_slice(&bytes).unwrap_or_default(),
        );
        let mut from_files: HashSet<String> = HashSet::new();
        if let Ok(dir) = fs::read_dir(Self::roots_dir(path)) {
            for entry in dir.flatten() {
                let entry_path = entry.path();
                if entry_path.extension().and_then(|e| e.to_str()) != Some("json") {
                    continue;
                }
                if let Some(file) = fs::read(&entry_path)
                    .ok()
                    .and_then(|bytes| serde_json::from_slice::<RootSnapshotFile>(&bytes).ok())
                {
                    from_files.insert(file.root.clone());
                    cache.snapshots.insert(file.root, file.snapshot);
                }
            }
        }
        // Roots still present only inline come from a document written before
        // the per-root layout; migrate them out on the next save. The main
        // document must also be rewritten once so the stale inline copies are
        // stripped (load already prefers the per-root files over them).
        cache.dirty_roots = cache
            .snapshots
            .keys()
            .filter(|root| !from_files.contains(*root))
            .cloned()
            .collect();
        cache.entries_dirty = !cache.dirty_roots.is_empty();
        cache
    }

    /// Persists whatever changed since `load` to the configured path: the main
    /// document only when an entry measurement changed, and one file per dirty
    /// root snapshot. All writes are atomic (temp file + rename) so a crash
    /// mid-save never corrupts a previously good document.
    pub fn save(&mut self) {
        if let Some(path) = Self::cache_path() {
            self.save_to(&path);
        }
    }

    /// Persists to a specific document path (tests and benchmarks inject it so
    /// they never touch the real cache).
    pub fn save_to(&mut self, path: &Path) {
        let Some(parent) = path.parent() else {
            return;
        };
        if self.entries_dirty && fs::create_dir_all(parent).is_ok() {
            let mut document = self.clone();
            document.snapshots.clear();
            if let Ok(json) = serde_json::to_string(&document) {
                write_atomic(path, json.as_bytes());
            }
        }
        if !self.dirty_roots.is_empty() {
            let roots_dir = Self::roots_dir(path);
            if fs::create_dir_all(&roots_dir).is_ok() {
                for root in std::mem::take(&mut self.dirty_roots) {
                    let Some(snapshot) = self.snapshots.get(&root) else {
                        continue;
                    };
                    let file = RootSnapshotFile {
                        root: root.clone(),
                        snapshot: snapshot.clone(),
                    };
                    if let Ok(json) = serde_json::to_string(&file) {
                        write_atomic(&roots_dir.join(root_file_name(&root)), json.as_bytes());
                    }
                }
            }
        }
        self.entries_dirty = false;
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

    /// Stores a measurement for `path`, marking the main document dirty.
    pub fn insert(&mut self, path: &Path, entry: CacheEntry) {
        self.entries_dirty = true;
        self.entries
            .insert(path.to_string_lossy().into_owned(), entry);
    }

    /// Returns the discovery snapshot for `root`, if one exists.
    #[must_use]
    pub fn snapshot(&self, root: &str) -> Option<&RootSnapshot> {
        self.snapshots.get(root)
    }

    /// Stores a discovery snapshot for `root`, marking that root dirty.
    pub fn insert_snapshot(&mut self, root: &str, snapshot: RootSnapshot) {
        self.dirty_roots.insert(root.to_string());
        self.snapshots.insert(root.to_string(), snapshot);
    }

    /// Directory holding one JSON file per root snapshot, sibling to the main
    /// document.
    fn roots_dir(path: &Path) -> PathBuf {
        path.with_file_name("scan-cache-roots")
    }
}

/// The on-disk form of one root snapshot: the root key plus its snapshot, so
/// the directory filename only needs to be a stable unique handle.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct RootSnapshotFile {
    root: String,
    snapshot: RootSnapshot,
}

/// Stable, filesystem-safe handle for a root snapshot file.
fn root_file_name(root: &str) -> String {
    let mut hasher = DefaultHasher::new();
    root.hash(&mut hasher);
    format!("{:016x}.json", hasher.finish())
}

/// Writes `bytes` to `path` via a same-directory temp file + rename, so a
/// crash mid-write leaves the previous file intact. Falls back to a direct
/// write if the rename is rejected (pathological platforms/filesystems).
fn write_atomic(path: &Path, bytes: &[u8]) {
    let tmp = path.with_extension("tmp");
    if fs::write(&tmp, bytes).is_err() {
        return;
    }
    if fs::rename(&tmp, path).is_err() {
        let _ = fs::write(path, bytes);
        let _ = fs::remove_file(&tmp);
    }
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

/// True when the snapshot was created within `MEASURE_TTL` of `now`. An
/// unparseable or missing `created_at` counts as expired so old cache files are
/// transparently re-measured on first access.
#[must_use]
pub fn is_snapshot_fresh(snapshot: &RootSnapshot, now: SystemTime) -> bool {
    parse_time(&snapshot.created_at).is_some_and(|at| {
        now.duration_since(at)
            .map_or(true, |age| age <= MEASURE_TTL)
    })
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

    #[test]
    fn snapshot_is_fresh_within_ttl() {
        let fresh = RootSnapshot {
            created_at: format_time(now() - DAY),
            ..RootSnapshot::default()
        };
        assert!(is_snapshot_fresh(&fresh, now()));
    }

    #[test]
    fn snapshot_expires_after_ttl() {
        let stale = RootSnapshot {
            created_at: format_time(now() - WEEK - DAY),
            ..RootSnapshot::default()
        };
        assert!(!is_snapshot_fresh(&stale, now()));
    }

    #[test]
    fn snapshot_without_timestamp_is_expired() {
        // Pre-TTL cache files have no `created_at`; they must be re-measured.
        assert!(!is_snapshot_fresh(&RootSnapshot::default(), now()));
    }

    fn tmp_main(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("cs-cache-test-{}-{tag}", std::process::id()));
        let _ = fs::create_dir_all(&dir);
        dir.join("scan-cache.json")
    }

    fn remove_tmp(main: &Path) {
        if let Some(dir) = main.parent() {
            let _ = fs::remove_dir_all(dir);
        }
    }

    fn snapshot_for(path: &str) -> RootSnapshot {
        RootSnapshot {
            targets: vec![StoredTarget {
                path: path.into(),
                folder_name: "sub".into(),
                size_bytes: 100,
                file_count: 3,
                last_modified: Some("last".into()),
            }],
            ..RootSnapshot::default()
        }
    }

    #[test]
    fn save_writes_dirty_root_files_and_round_trips() {
        let main = tmp_main("roots");
        let mut cache = ScanCache::default();
        let t = now();
        let mut e = entry(t);
        e.dir_mtime = format_time(t);
        cache.insert(Path::new("/tmp/t"), e);
        cache.insert_snapshot(
            "/home/user/proj",
            snapshot_for("/home/user/proj/node_modules"),
        );

        cache.save_to(&main);

        // Main document carries entries only; snapshots live in their own files.
        let doc: serde_json::Value =
            serde_json::from_str(&fs::read_to_string(&main).expect("main document written"))
                .expect("valid json");
        assert_eq!(doc["snapshots"], serde_json::json!({}));
        let roots_dir = main.with_file_name("scan-cache-roots");
        let files: Vec<_> = fs::read_dir(&roots_dir)
            .expect("roots dir written")
            .flatten()
            .collect();
        assert_eq!(files.len(), 1);

        let reloaded = ScanCache::load_from(&main);
        assert!(reloaded.snapshot("/home/user/proj").is_some());
        assert!(reloaded.hit(Path::new("/tmp/t"), t, t).is_some());
        remove_tmp(&main);
    }

    #[test]
    fn legacy_inline_snapshots_migrate_to_root_files() {
        let main = tmp_main("legacy");
        let mut legacy = ScanCache::default();
        legacy
            .snapshots
            .insert("/old/root".into(), snapshot_for("/old/root/build"));
        fs::write(
            &main,
            serde_json::to_vec(&legacy).expect("serialize legacy"),
        )
        .expect("write legacy doc");

        let mut cache = ScanCache::load_from(&main);
        assert!(cache.snapshot("/old/root").is_some());
        assert!(cache.dirty_roots.contains("/old/root"));
        cache.save_to(&main);

        let doc: serde_json::Value =
            serde_json::from_str(&fs::read_to_string(&main).expect("doc rewritten"))
                .expect("valid json");
        assert_eq!(doc["snapshots"], serde_json::json!({}));
        assert_eq!(
            fs::read_dir(main.with_file_name("scan-cache-roots"))
                .expect("roots dir")
                .count(),
            1
        );

        let reloaded = ScanCache::load_from(&main);
        assert!(reloaded.snapshot("/old/root").is_some());
        assert!(reloaded.dirty_roots.is_empty());
        remove_tmp(&main);
    }

    #[test]
    fn save_is_atomic_and_leaves_no_temp_files() {
        let main = tmp_main("atomic");
        let mut cache = ScanCache::default();
        cache.insert_snapshot("/r", RootSnapshot::default());
        let mut e = entry(now());
        e.dir_mtime = format_time(now());
        cache.insert(Path::new("/tmp/t"), e);

        cache.save_to(&main);
        assert!(main.exists());
        assert!(!main.with_extension("tmp").exists());
        let roots_dir = main.with_file_name("scan-cache-roots");
        for entry in fs::read_dir(&roots_dir).expect("roots dir") {
            let name = entry.expect("dir entry").file_name();
            assert!(name.to_string_lossy().ends_with(".json"));
        }
        remove_tmp(&main);
    }
}

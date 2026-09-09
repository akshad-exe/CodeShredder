//! Parallel scanner that walks project roots and measures build-output folders.
//!
//! Uses `jwalk` to walk roots in parallel, pruning matched, virtual-environment
//! and protected folders so they are never descended into, and measures each
//! target on a worker thread, streaming it to a channel as soon as its size is
//! known.
//!
//! Two caches make repeat scans of untouched projects near-instant:
//!
//! - A per-root **discovery snapshot** (Option A): the mtime fingerprint of
//!   every directory walked. If the fingerprint matches the previous scan, the
//!   previously discovered targets are replayed without re-walking or
//!   re-measuring anything.
//! - A per-target **size cache**: replayed when a found folder's own metadata
//!   is unchanged, so re-scanning a project with a modified sibling skips
//!   measuring the untouched folders.

use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};
use std::time::{Instant, SystemTime};

use jwalk::WalkDir;
use uuid::Uuid;

use crate::domain::pattern::{category_for, is_venv_name, DEFAULT_PATTERNS};
use crate::domain::scan::{ScanInput, ScanTarget};
use crate::services::safety::{classify, is_protected};
use crate::storage::cache::{CacheEntry, DirStamp, RootSnapshot, ScanCache, StoredTarget};

/// Raised when the user asks to stop a running scan. Read (never written) by
/// the walker, so it is safe to call from any thread.
static CANCEL_REQUESTED: AtomicBool = AtomicBool::new(false);

/// Live scan counters, shared across every root's walker and measurer. All
/// atomics so the parallel walk needs no lock. Read once at the end of a scan
/// for the performance baseline.
#[derive(Debug, Default)]
struct ScanStats {
    /// `symlink_metadata` calls paid while walking and measuring.
    metadata_calls: AtomicU64,
    /// Directories whose children were enumerated (walked into).
    dirs_enumerated: AtomicU64,
    /// Files whose size/count contributed to a measurement.
    files_measured: AtomicU64,
    /// Targets streamed to the channel (measured or replayed from cache).
    targets_emitted: AtomicU64,
    /// Milliseconds spent discovering (walking roots, building fingerprints).
    time_discovering_ms: AtomicU64,
    /// Milliseconds spent measuring matched folders.
    time_measuring_ms: AtomicU64,
    /// Milliseconds spent persisting the cache back to disk.
    time_saving_ms: AtomicU64,
}

impl ScanStats {
    fn log(&self) {
        tracing::info!(
            metadata_calls = self.metadata_calls.load(Ordering::Relaxed),
            dirs_enumerated = self.dirs_enumerated.load(Ordering::Relaxed),
            files_measured = self.files_measured.load(Ordering::Relaxed),
            targets_emitted = self.targets_emitted.load(Ordering::Relaxed),
            time_discovering_ms = self.time_discovering_ms.load(Ordering::Relaxed),
            time_measuring_ms = self.time_measuring_ms.load(Ordering::Relaxed),
            time_saving_ms = self.time_saving_ms.load(Ordering::Relaxed),
            "scan stats"
        );
    }

/// Adds an elapsed `Instant` delta to one of the ms counters. Elapsed is a
    /// `u128` and the counters are `u64`; a count above `u64::MAX` ms (~292 M
    /// years) is not reachable, so a saturating cast is exact in practice.
    fn add_elapsed_ms(target: &AtomicU64, since: Instant) {
        target.fetch_add(
            u64::try_from(since.elapsed().as_millis()).unwrap_or(u64::MAX),
            Ordering::Relaxed,
        );
    }
}

/// Directory names that are never cleanup targets themselves and never contain
/// one, so walking inside them is pure waste. Mirrors the idea behind
/// `PROTECTED_ROOTS`: if the app would never touch anything down there, don't
/// look there.
const NO_JUNK_DIRS: &[&str] = &[
    ".git",
    ".hg",
    ".svn",
    ".bzr",
    "AppData",
    ".global_caches",
    ".cache",
];

/// Finds known developer-junk folders inside the given scan roots.
pub struct ScannerEngine;

impl ScannerEngine {
    /// Asks an in-progress scan to stop early. The next time the walker checks
    /// the flag it will stop descending and finish with whatever it found.
    pub fn request_cancel() {
        CANCEL_REQUESTED.store(true, Ordering::Relaxed);
    }

    /// Runs a scan and streams every matched target to `tx` as soon as it is
    /// measured. Returns the elapsed time once the walk finishes.
    ///
    /// The directory walk and the per-target measurement both run on rayon's
    /// global thread pool (jwalk uses it internally), so a large scan uses
    /// every available core.
    pub fn scan_stream(input: &ScanInput, tx: &Sender<ScanTarget>) -> f64 {
        let started = Instant::now();
        CANCEL_REQUESTED.store(false, Ordering::Relaxed);

        let patterns: Arc<HashSet<String>> = Arc::new(build_patterns(input));
        let ignore: Arc<Vec<String>> = Arc::new(build_ignore(input));
        let cache = Arc::new(Mutex::new(ScanCache::load()));
        let stats = Arc::new(ScanStats::default());
        let roots = normalize_roots(&input.roots);

        rayon::scope(|scope| {
            for root in roots {
                let tx = tx.clone();
                let patterns = patterns.clone();
                let ignore = ignore.clone();
                let cache = cache.clone();
                let stats = stats.clone();
                scope.spawn(move |_| walk_root(&root, &patterns, &ignore, &cache, &stats, &tx));
            }
        });

        let save_started = Instant::now();
        if let Ok(guard) = cache.lock() {
            guard.save();
        }
        stats
            .time_saving_ms
            .fetch_add(
                u64::try_from(save_started.elapsed().as_millis()).unwrap_or(u64::MAX),
                Ordering::Relaxed,
            );

        stats.log();

        started.elapsed().as_secs_f64()
    }
}

/// Walks `root` with jwalk, pruning matched, virtual-environment and
/// no-junk folders so they are never descended into.
///
/// A single walk collects the directory-mtime fingerprint AND the paths of the
/// matched targets. If the fingerprint matches the previous scan's snapshot,
/// the stored targets are replayed without re-measuring anything; otherwise the
/// matched folders are measured in parallel, streamed to `tx` and the snapshot
/// is refreshed.
#[expect(clippy::too_many_lines)]
fn walk_root(
    root: &Path,
    patterns: &Arc<HashSet<String>>,
    ignore: &Arc<Vec<String>>,
    cache: &Arc<Mutex<ScanCache>>,
    stats: &Arc<ScanStats>,
    tx: &Sender<ScanTarget>,
) {
    let walker = WalkDir::new(root)
        .skip_hidden(false)
        .process_read_dir({
            let patterns = patterns.clone();
            let ignore = ignore.clone();
            move |_depth, _path, _state, children| {
                prune_children(&patterns, &ignore, children);
            }
        });

    let mut fingerprint = Vec::new();
    let mut matched = Vec::new();

    let discovering_started = Instant::now();
    for entry in walker {
        if CANCEL_REQUESTED.load(Ordering::Relaxed) {
            break;
        }
        let Ok(entry) = entry else {
            continue;
        };
        if !entry.file_type.is_dir() {
            continue;
        }

        // Record the dir in the fingerprint regardless of whether it is a
        // target: its mtime is the invalidation signal for this snapshot.
        if let Ok(meta) = fs::symlink_metadata(entry.path()) {
            stats
                .metadata_calls
                .fetch_add(1, Ordering::Relaxed);
            stats
                .dirs_enumerated
                .fetch_add(1, Ordering::Relaxed);
            if let Ok(mtime) = meta.modified() {
                fingerprint.push(DirStamp {
                    path: entry.path().to_string_lossy().into_owned(),
                    mtime_nanos: mtime
                        .duration_since(SystemTime::UNIX_EPOCH)
                        .map_or(0, |d| d.as_nanos()),
                });
            }
        }

        let name = entry.file_name.to_string_lossy().into_owned();
        let is_match = patterns.contains(&name) || (is_venv_name(&name) && venv_enabled(patterns));
        if is_match && !is_ignored(&entry.path(), &name, ignore) {
            matched.push((entry.path(), name));
        }
    }

    fingerprint.sort_unstable_by(|a, b| a.path.cmp(&b.path));
    ScanStats::add_elapsed_ms(&stats.time_discovering_ms, discovering_started);

    let key = root.to_string_lossy().into_owned();
    let mut effective_patterns: Vec<String> = patterns.iter().cloned().collect();
    effective_patterns.sort_unstable();
    let mut effective_ignore: Vec<String> = ignore.as_ref().clone();
    effective_ignore.sort_unstable();

    // Option A: if nothing under the root changed since the last scan, replay
    // the previously discovered targets and skip the measurement work entirely.
    if let Some(snapshot) = cache.lock().ok().and_then(|g| g.snapshot(&key).cloned()) {
        if snapshot.patterns == effective_patterns
            && snapshot.ignore == effective_ignore
            && snapshot.fingerprint == fingerprint
        {
            for stored in &snapshot.targets {
                if CANCEL_REQUESTED.load(Ordering::Relaxed) {
                    break;
                }
                stats
                    .targets_emitted
                    .fetch_add(1, Ordering::Relaxed);
                let _ = tx.send(ScanTarget {
                    id: Uuid::new_v4().to_string(),
                    path: stored.path.clone(),
                    display_path: display_path_for(Path::new(&stored.path), &stored.folder_name),
                    project_name: project_root_name(Path::new(&stored.path), &stored.folder_name),
                    folder_name: stored.folder_name.clone(),
                    category: category_for(&stored.folder_name).to_owned(),
                    size_bytes: stored.size_bytes,
                    file_count: stored.file_count,
                    last_modified: stored.last_modified.clone(),
                    safety_level: classify(&stored.folder_name, Path::new(&stored.path)),
                    selected: false,
                });
            }
            return;
        }
    }

    // Cache miss: measure every matched folder in parallel, streaming each
    // target as soon as its size is known, and store the fresh snapshot.
    let measuring_started = Instant::now();
    let new_targets = Arc::new(Mutex::new(Vec::new()));
    rayon::scope(|scope| {
        for (dir, name) in matched {
            let tx = tx.clone();
            let cache = cache.clone();
            let stats = stats.clone();
            let new_targets = new_targets.clone();
            scope.spawn(move |_| {
                let target = measure_target(&dir, &name, &cache, &stats);
                // The rayon scope below joins every spawned task before it
                // returns, so no task can panic-and-drop while these other
                // tasks still hold the lock.
                new_targets
                    .lock()
                    .expect("scan task panicked while holding lock")
                    .push(target.clone());
                stats
                    .targets_emitted
                    .fetch_add(1, Ordering::Relaxed);
                let _ = tx.send(target);
            });
        }
    });
    ScanStats::add_elapsed_ms(&stats.time_measuring_ms, measuring_started);

    let targets = new_targets
        .lock()
        .expect("scan task panicked while holding lock")
        .clone();
    if let Ok(mut guard) = cache.lock() {
        guard.insert_snapshot(
            &key,
            RootSnapshot {
                fingerprint,
                patterns: effective_patterns,
                ignore: effective_ignore,
                targets: targets
                    .into_iter()
                    .map(|t| StoredTarget {
                        path: t.path,
                        folder_name: t.folder_name,
                        size_bytes: t.size_bytes,
                        file_count: t.file_count,
                        last_modified: t.last_modified,
                    })
                    .collect(),
            },
        );
    }
}

/// Prunes child entries that should not be descended into: matched targets,
/// virtual environments, ignored folders and no-junk directories.
fn prune_children(
    patterns: &HashSet<String>,
    ignore: &[String],
    children: &mut [jwalk::Result<jwalk::DirEntry<((), ())>>],
) {
    for entry in children.iter_mut().flatten() {
        if entry.file_type.is_dir() {
            let name = entry.file_name.to_string_lossy();
            let is_venv = is_venv_name(&name);
            if patterns.contains(name.as_ref())
                || is_venv
                || NO_JUNK_DIRS.contains(&name.as_ref())
                || is_ignored(&entry.path(), &name, ignore)
                || is_protected(&entry.path())
            {
                entry.read_children_path = None;
            }
        }
    }
}

/// True when a directory is covered by an ignore rule: either its name equals
/// a name rule (case-insensitive), or its path contains a rule that includes a
/// path separator (compared as a normalized path substring).
fn is_ignored(dir: &Path, name: &str, ignore: &[String]) -> bool {
    ignore.iter().any(|rule| {
        if rule.contains('/') || rule.contains('\\') {
            let dir_norm = dir.to_string_lossy().replace('\\', "/").to_lowercase();
            dir_norm.contains(&rule.to_lowercase())
        } else {
            name.eq_ignore_ascii_case(rule)
        }
    })
}

/// Measures total size, file count and newest modification time under `dir`,
/// reusing the cached values when the directory metadata is unchanged.
fn measure_target(
    dir: &Path,
    folder_name: &str,
    cache: &Mutex<ScanCache>,
    stats: &Arc<ScanStats>,
) -> ScanTarget {
    let dir_mtime = fs::symlink_metadata(dir)
        .ok()
        .and_then(|meta| meta.modified().ok());
    stats
        .metadata_calls
        .fetch_add(1, Ordering::Relaxed);

    // Fast path: replay the cached measurement when the target directory's own
    // mtime is unchanged. This avoids walking large folders on repeat scans.
    if let (Some(mtime), Ok(guard)) = (dir_mtime, cache.lock()) {
        if let Some(entry) = guard.hit(dir, mtime) {
            return ScanTarget {
                id: Uuid::new_v4().to_string(),
                path: dir.to_string_lossy().into_owned(),
                display_path: display_path_for(dir, folder_name),
                project_name: project_root_name(dir, folder_name),
                folder_name: folder_name.to_owned(),
                category: category_for(folder_name).to_owned(),
                size_bytes: entry.size_bytes,
                file_count: entry.file_count,
                last_modified: Some(entry.last_modified.clone()),
                safety_level: classify(folder_name, dir),
                selected: false,
            };
        }
    }

    let size = Arc::new(AtomicU64::new(0));
    let count = Arc::new(AtomicU64::new(0));
    let latest = Arc::new(Mutex::new(None::<SystemTime>));

    rayon::in_place_scope(|scope| {
        measure_under(dir, &size, &count, &latest, scope, stats);
    });

    let last_modified = latest
        .lock()
        .ok()
        .and_then(|guard| *guard)
        .map(format_time);
    let size_bytes = size.load(Ordering::Relaxed);
    let file_count = count.load(Ordering::Relaxed);

    if let (Some(mtime), Ok(mut guard)) = (dir_mtime, cache.lock()) {
        guard.insert(
            dir,
            CacheEntry {
                size_bytes,
                file_count,
                last_modified: last_modified.clone().unwrap_or_default(),
                dir_mtime: format_time(mtime),
                measured_at: format_time(SystemTime::now()),
            },
        );
    }

    let project_name = project_root_name(dir, folder_name);

    ScanTarget {
        id: Uuid::new_v4().to_string(),
        path: dir.to_string_lossy().into_owned(),
        display_path: display_path_for(dir, folder_name),
        project_name,
        folder_name: folder_name.to_owned(),
        category: category_for(folder_name).to_owned(),
        size_bytes,
        file_count,
        last_modified,
        safety_level: classify(folder_name, dir),
        selected: false,
    }
}

/// Accumulates size/count/modified-time under `dir` into the shared counters.
fn measure_under(
    dir: &Path,
    size: &Arc<AtomicU64>,
    count: &Arc<AtomicU64>,
    latest: &Arc<Mutex<Option<SystemTime>>>,
    scope: &rayon::Scope<'_>,
    stats: &Arc<ScanStats>,
) {
    if CANCEL_REQUESTED.load(Ordering::Relaxed) {
        return;
    }
    let Ok(meta) = fs::symlink_metadata(dir) else {
        return;
    };
    stats
        .metadata_calls
        .fetch_add(1, Ordering::Relaxed);
    if meta.file_type().is_symlink() {
        return;
    }
    if meta.is_dir() {
        if let Ok(mtime) = meta.modified() {
            update_latest(latest, mtime);
        }
        let Ok(entries) = fs::read_dir(dir) else {
            return;
        };
        stats
            .dirs_enumerated
            .fetch_add(1, Ordering::Relaxed);
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let size = size.clone();
                let count = count.clone();
                let latest = latest.clone();
                let stats = stats.clone();
                scope.spawn(move |s| measure_under(&path, &size, &count, &latest, s, &stats));
            } else if let Ok(m) = fs::symlink_metadata(&path) {
                stats
                    .metadata_calls
                    .fetch_add(1, Ordering::Relaxed);
                if m.is_file() {
                    size.fetch_add(m.len(), Ordering::Relaxed);
                    count.fetch_add(1, Ordering::Relaxed);
                    stats
                        .files_measured
                        .fetch_add(1, Ordering::Relaxed);
                    if let Ok(mtime) = m.modified() {
                        update_latest(latest, mtime);
                    }
                }
            }
        }
    } else if meta.is_file() {
        size.fetch_add(meta.len(), Ordering::Relaxed);
        count.fetch_add(1, Ordering::Relaxed);
        stats
            .files_measured
            .fetch_add(1, Ordering::Relaxed);
        if let Ok(mtime) = meta.modified() {
            update_latest(latest, mtime);
        }
    }
}

/// True when the user has opted into cleaning virtual environments, i.e. one of
/// the venv family patterns (`.venv` or `venv`) is enabled.
fn venv_enabled(patterns: &HashSet<String>) -> bool {
    patterns.contains(".venv") || patterns.contains("venv")
}

/// Builds the effective pattern set, defaulting when the input is empty.
fn build_patterns(input: &ScanInput) -> HashSet<String> {
    let mut patterns: HashSet<String> = input
        .patterns
        .iter()
        .map(|p| p.trim().to_owned())
        .filter(|p| !p.is_empty())
        .collect();
    if patterns.is_empty() {
        patterns.extend(DEFAULT_PATTERNS.iter().map(|p| (*p).to_owned()));
    }
    patterns
}

/// Builds the effective ignore rules, trimming and dropping empty entries.
fn build_ignore(input: &ScanInput) -> Vec<String> {
    input
        .ignore
        .iter()
        .map(|r| r.trim().to_owned())
        .filter(|r| !r.is_empty())
        .collect()
}

/// Expands a leading `~/` to the user's home directory.
fn expand_root(raw: &str) -> PathBuf {
    let trimmed = raw.trim();
    if let Some(rest) = trimmed.strip_prefix("~/") {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(home).join(rest);
        }
    }
    PathBuf::from(trimmed)
}

/// Normalizes the scan roots into one effective, deduplicated set:
///
/// - canonicalizes each root (falling back to the expanded path when
///   canonicalization fails, e.g. on some network/removable drives),
/// - keeps only existing directories,
/// - drops duplicate roots,
/// - drops any root that is a descendant of another root in the set, so
///   nested roots never scan the same files twice (e.g. `~/Code` and
///   `~/Code/ProjectX` would otherwise double-walk `ProjectX`).
fn normalize_roots(raw: &[String]) -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = Vec::new();
    for raw_root in raw {
        let expanded = expand_root(raw_root);
        let canonical = fs::canonicalize(&expanded).unwrap_or(expanded);
        if canonical.is_dir() && !roots.contains(&canonical) {
            roots.push(canonical);
        }
    }

    // Shortest-first so an ancestor always precedes its descendants.
    roots.sort_by_key(|p| p.components().count());

    let mut top: Vec<PathBuf> = Vec::new();
    for root in roots {
        if top.iter().any(|t| root.starts_with(t)) {
            continue;
        }
        top.push(root);
    }

    tracing::debug!(roots = ?top, "normalized scan roots");
    top
}

/// The project root folder name, e.g. `CodeShredder` for
/// `.../CodeShredder/src-tauri/target` or `Kiko` for `.../Kiko/node_modules`.
/// `target` folders sit two levels down (project root -> crate -> target), so
/// they look one level further up than everything else.
fn project_root_name(dir: &Path, folder_name: &str) -> String {
    let depth = if folder_name == "target" { 2 } else { 1 };
    dir.ancestors()
        .nth(depth)
        .and_then(|p| p.file_name())
        .and_then(|n| n.to_str())
        .unwrap_or_default()
        .to_owned()
}

/// Short path shown in the results list, e.g. `CodeShredder\src-tauri` for a
/// `target` folder or `Kiko\node_modules` for a `node_modules` folder.
fn display_path_for(dir: &Path, folder_name: &str) -> String {
    let sep = std::path::MAIN_SEPARATOR;
    let parent = dir
        .parent()
        .and_then(|p| p.file_name())
        .and_then(|n| n.to_str());
    if folder_name == "target" {
        if let (Some(grandparent), Some(parent)) = (
            dir.ancestors()
                .nth(2)
                .and_then(|p| p.file_name())
                .and_then(|n| n.to_str()),
            parent,
        ) {
            return format!("{grandparent}{sep}{parent}");
        }
    } else if let Some(parent) = parent {
        return format!("{parent}{sep}{folder_name}");
    }
    dir.to_string_lossy().into_owned()
}

/// Records the newer of two modification times.
fn update_latest(latest: &Mutex<Option<SystemTime>>, mtime: SystemTime) {
    let mut guard = latest.lock().unwrap_or_else(std::sync::PoisonError::into_inner);
    match *guard {
        Some(existing) if existing > mtime => {}
        _ => *guard = Some(mtime),
    }
}

fn format_time(time: SystemTime) -> String {
    let dt: chrono::DateTime<chrono::Local> = time.into();
    // Nanos precision: the size cache compares the stored `dir_mtime` against
    // a freshly formatted one, so both sides must agree exactly or the cache
    // would never hit.
    dt.to_rfc3339_opts(chrono::SecondsFormat::Nanos, true)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Creates a throwaway directory tree under the OS temp dir:
    /// `{unique}/A/B` and `{unique}/A/C`. Returns it without auto-cleanup so
    /// the caller controls lifetime.
    fn temp_tree() -> PathBuf {
        let base = std::env::temp_dir().join(format!(
            "cs-scan-root-test-{}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(base.join("A/B")).expect("create A/B");
        fs::create_dir_all(base.join("A/C")).expect("create A/C");
        base
    }

    #[test]
    fn normalize_roots_dedupes_identical_paths() {
        let base = temp_tree();
        let root = base.join("A/B");
        let normalized = normalize_roots(&[
            root.to_string_lossy().into_owned(),
            root.to_string_lossy().into_owned(),
        ]);
        assert_eq!(normalized, vec![root]);
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn normalize_roots_drops_nested_roots() {
        let base = temp_tree();
        let nested = base.join("A/B").to_string_lossy().into_owned();
        let parent = base.join("A").to_string_lossy().into_owned();
        let normalized = normalize_roots(&[nested, parent]);
        // The ancestor must win; the descendant root is skipped.
        assert_eq!(normalized, vec![base.join("A")]);
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn normalize_roots_skips_missing_dirs() {
        let base = temp_tree();
        let missing = base.join("does-not-exist").to_string_lossy().into_owned();
        let real = base.join("A").to_string_lossy().into_owned();
        let normalized = normalize_roots(&[missing, real]);
        assert_eq!(normalized, vec![base.join("A")]);
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn normalize_roots_keeps_siblings() {
        let base = temp_tree();
        let a = base.join("A").to_string_lossy().into_owned();
        let member = base.join("A/B").to_string_lossy().into_owned();
        let sibling = base.join("sibling");
        fs::create_dir_all(&sibling).expect("create sibling");
        let sibling_s = sibling.to_string_lossy().into_owned();
        let normalized = normalize_roots(&[a, member, sibling_s]);
        assert_eq!(normalized, vec![base.join("A"), sibling]);
        let _ = fs::remove_dir_all(&base);
    }
}

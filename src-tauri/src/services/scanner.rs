//! Parallel scanner: walks the given roots in parallel with `jwalk`, prunes
//! matched, virtual-environment and protected folders so they are never
//! descended into, measures each target on a worker thread and streams it to a
//! channel as soon as its size is known.
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

        rayon::scope(|scope| {
            for raw in &input.roots {
                let root = expand_root(raw);
                if root.is_dir() {
                    let tx = tx.clone();
                    let patterns = patterns.clone();
                    let ignore = ignore.clone();
                    let cache = cache.clone();
                    scope.spawn(move |_| walk_root(&root, patterns, ignore, cache, tx));
                }
            }
        });

        if let Ok(guard) = cache.lock() {
            guard.save();
        }

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
fn walk_root(
    root: &Path,
    patterns: Arc<HashSet<String>>,
    ignore: Arc<Vec<String>>,
    cache: Arc<Mutex<ScanCache>>,
    tx: Sender<ScanTarget>,
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
            if let Ok(mtime) = meta.modified() {
                fingerprint.push(DirStamp {
                    path: entry.path().to_string_lossy().into_owned(),
                    mtime_nanos: mtime
                        .duration_since(SystemTime::UNIX_EPOCH)
                        .map(|d| d.as_nanos())
                        .unwrap_or(0),
                });
            }
        }

        let name = entry.file_name.to_string_lossy().into_owned();
        let matches = patterns.contains(&name) || (is_venv_name(&name) && venv_enabled(&patterns));
        if matches && !is_ignored(&entry.path(), &name, &ignore) {
            matched.push((entry.path(), name));
        }
    }

    fingerprint.sort_unstable_by(|a, b| a.path.cmp(&b.path));

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
    let new_targets = Arc::new(Mutex::new(Vec::new()));
    rayon::scope(|scope| {
        for (dir, name) in matched {
            let tx = tx.clone();
            let cache = cache.clone();
            let new_targets = new_targets.clone();
            scope.spawn(move |_| {
                let target = measure_target(&dir, &name, &cache);
                new_targets.lock().unwrap().push(target.clone());
                let _ = tx.send(target);
            });
        }
    });

    let targets = new_targets.lock().unwrap().clone();
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
fn measure_target(dir: &Path, folder_name: &str, cache: &Mutex<ScanCache>) -> ScanTarget {
    let dir_mtime = fs::symlink_metadata(dir)
        .ok()
        .and_then(|meta| meta.modified().ok());

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
        measure_under(dir, size.clone(), count.clone(), latest.clone(), scope);
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
    size: Arc<AtomicU64>,
    count: Arc<AtomicU64>,
    latest: Arc<Mutex<Option<SystemTime>>>,
    scope: &rayon::Scope<'_>,
) {
    if CANCEL_REQUESTED.load(Ordering::Relaxed) {
        return;
    }
    let Ok(meta) = fs::symlink_metadata(dir) else {
        return;
    };
    if meta.file_type().is_symlink() {
        return;
    }
    if meta.is_dir() {
        if let Ok(mtime) = meta.modified() {
            update_latest(&latest, mtime);
        }
        let Ok(entries) = fs::read_dir(dir) else {
            return;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let size = size.clone();
                let count = count.clone();
                let latest = latest.clone();
                scope.spawn(move |s| measure_under(&path, size, count, latest, s));
            } else if let Ok(m) = fs::symlink_metadata(&path) {
                if m.is_file() {
                    size.fetch_add(m.len(), Ordering::Relaxed);
                    count.fetch_add(1, Ordering::Relaxed);
                    if let Ok(mtime) = m.modified() {
                        update_latest(&latest, mtime);
                    }
                }
            }
        }
    } else if meta.is_file() {
        size.fetch_add(meta.len(), Ordering::Relaxed);
        count.fetch_add(1, Ordering::Relaxed);
        if let Ok(mtime) = meta.modified() {
            update_latest(&latest, mtime);
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
    let mut guard = latest.lock().unwrap_or_else(|e| e.into_inner());
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

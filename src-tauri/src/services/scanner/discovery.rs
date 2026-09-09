//! Walking roots, building fingerprints and replaying snapshots.

use std::collections::HashSet;
use std::fs;
use std::path::Path;
use std::sync::atomic::Ordering;
use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};
use std::time::{Instant, SystemTime};

use jwalk::WalkDir;
use uuid::Uuid;

use crate::domain::pattern::{category_for, is_venv_name};
use crate::domain::scan::ScanTarget;
use crate::services::safety::classify;
use crate::services::scanner::display::{display_path_for, project_root_name};
use crate::services::scanner::measure::measure_target;
use crate::services::scanner::prune::prune_children;
use crate::services::scanner::{venv_enabled, ScanStats, CANCEL_REQUESTED};
use crate::storage::cache::{DirStamp, RootSnapshot, ScanCache, StoredTarget};

/// Walks `root` with `jwalk`, replaying the previous snapshot when the tree is
/// unchanged, otherwise measuring every matched folder on the bounded
/// measurement pool and streaming targets as soon as their size is known.
///
/// A fresh snapshot is stored only for roots that actually changed; roots that
/// matched and replayed keep whatever they had.
#[expect(clippy::too_many_lines)]
pub(super) fn walk_root(
    root: &Path,
    patterns: &Arc<HashSet<String>>,
    ignore: &Arc<Vec<String>>,
    cache: &Arc<Mutex<ScanCache>>,
    stats: &Arc<ScanStats>,
    measure_pool: &Arc<rayon::ThreadPool>,
    tx: &Sender<ScanTarget>,
) {
    let walker = WalkDir::new(root).skip_hidden(false).process_read_dir({
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
            stats.metadata_calls.fetch_add(1, Ordering::Relaxed);
            stats.dirs_enumerated.fetch_add(1, Ordering::Relaxed);
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
                stats.targets_emitted.fetch_add(1, Ordering::Relaxed);
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

    // Cache miss: measure every matched folder on the bounded measurement pool,
    // streaming each target as soon as its size is known, and store the fresh
    // snapshot. Sub-tree fan-out also lands on this pool, so the pool size caps
    // how many threads touch the disk at once no matter how many targets match.
    let measuring_started = Instant::now();
    let new_targets = Arc::new(Mutex::new(Vec::new()));
    measure_pool.scope(|scope| {
        for (dir, name) in &matched {
            let tx = tx.clone();
            let cache = cache.clone();
            let stats = stats.clone();
            let new_targets = new_targets.clone();
            let measure_pool = measure_pool.clone();
            scope.spawn(move |_| {
                let target = measure_target(dir, name, &cache, &stats, &measure_pool);
                new_targets
                    .lock()
                    .expect("scan task panicked while holding lock")
                    .push(target.clone());
                stats.targets_emitted.fetch_add(1, Ordering::Relaxed);
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

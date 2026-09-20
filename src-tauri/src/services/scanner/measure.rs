//! Measuring matched folders on the bounded worker pool.

use std::fs;
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::SystemTime;

use uuid::Uuid;

use crate::domain::mtime::format_time;
use crate::domain::pattern::category_for;
use crate::domain::scan::ScanTarget;
use crate::services::safety::classify;
use crate::services::scanner::display::{display_path_for, project_root_name, project_root_path};
use crate::services::scanner::{ScanStats, CANCEL_REQUESTED};
use crate::storage::cache::{CacheEntry, ScanCache};

/// Measures total size, file count and newest modification time under `dir`,
/// reusing the cached values when the directory metadata is unchanged.
///
/// Reuse is decided in two steps, cheapest first:
///
/// 1. `ScanCache::hit` — the target's own mtime is unchanged and the
///    measurement is still within `MEASURE_TTL` → replay.
/// 2. Full measurement.
pub(super) fn measure_target(
    dir: &Path,
    folder_name: &str,
    cache: &Mutex<ScanCache>,
    stats: &Arc<ScanStats>,
    measure_pool: &Arc<rayon::ThreadPool>,
) -> ScanTarget {
    let dir_mtime = fs::symlink_metadata(dir)
        .ok()
        .and_then(|meta| meta.modified().ok());
    stats.metadata_calls.fetch_add(1, Ordering::Relaxed);
    let now = SystemTime::now();

    // Step 1: cheap replay when the target's own mtime is unchanged and the
    // measurement is fresh. Avoids walking large folders on repeat scans.
    if let (Some(mtime), Ok(guard)) = (dir_mtime, cache.lock()) {
        if let Some(entry) = guard.hit(dir, mtime, now) {
            return replay_entry(dir, folder_name, entry);
        }
    }

    // Step 2: full measurement.
    let measure = MeasureState::new(stats);
    measure_pool.in_place_scope(|scope| {
        measure_dir(dir, dir, &measure, scope);
    });

    let last_modified = measure
        .latest
        .lock()
        .ok()
        .and_then(|guard| *guard)
        .map(format_time);
    let size_bytes = measure.size.load(Ordering::Relaxed);
    let file_count = measure.count.load(Ordering::Relaxed);

    if let (Some(mtime), Ok(mut guard)) = (dir_mtime, cache.lock()) {
        guard.insert(
            dir,
            CacheEntry {
                size_bytes,
                file_count,
                last_modified: last_modified.clone().unwrap_or_default(),
                dir_mtime: format_time(mtime),
                measured_at: format_time(now),
            },
        );
    }

    let project_name = project_root_name(dir, folder_name);

    ScanTarget {
        id: Uuid::new_v4().to_string(),
        path: dir.to_string_lossy().into_owned(),
        display_path: display_path_for(dir, folder_name),
        project_name,
        project_path: project_root_path(dir, folder_name)
            .to_string_lossy()
            .into_owned(),
        folder_name: folder_name.to_owned(),
        category: category_for(folder_name).to_owned(),
        size_bytes,
        file_count,
        last_modified,
        safety_level: classify(folder_name, dir),
        selected: false,
    }
}

/// Builds the display target for a cached measurement. Fields are either stored
/// facts or cheap path-derived value, recomputed on every replay.
fn replay_entry(dir: &Path, folder_name: &str, entry: &CacheEntry) -> ScanTarget {
    ScanTarget {
        id: Uuid::new_v4().to_string(),
        path: dir.to_string_lossy().into_owned(),
        display_path: display_path_for(dir, folder_name),
        project_name: project_root_name(dir, folder_name),
        project_path: project_root_path(dir, folder_name)
            .to_string_lossy()
            .into_owned(),
        folder_name: folder_name.to_owned(),
        category: category_for(folder_name).to_owned(),
        size_bytes: entry.size_bytes,
        file_count: entry.file_count,
        last_modified: Some(entry.last_modified.clone()),
        safety_level: classify(folder_name, dir),
        selected: false,
    }
}

/// Shared accumulators for one target measurement, threaded through
/// `measure_dir`.
struct MeasureState {
    size: Arc<AtomicU64>,
    count: Arc<AtomicU64>,
    latest: Arc<Mutex<Option<SystemTime>>>,
    stats: Arc<ScanStats>,
}

impl MeasureState {
    fn new(stats: &Arc<ScanStats>) -> Self {
        Self {
            size: Arc::new(AtomicU64::new(0)),
            count: Arc::new(AtomicU64::new(0)),
            latest: Arc::new(Mutex::new(None)),
            stats: stats.clone(),
        }
    }
}

/// Measures the tree under `dir`, accumulating size, file count and newest
/// modification time into the shared counters.
///
/// Subdirectories are spawned onto the same bounded measurement pool instead of
/// rayon's global pool. Fan-out per directory is what made cache-hot scans fast
/// (a single huge target spreads across many cores), while routing it through
/// the bounded pool caps how many threads actually touch the disk at once.
/// `dir` itself is skipped when missing, unreadable or a symlink; symlinked
/// children are never descended into.
fn measure_dir(dir: &Path, root: &Path, state: &MeasureState, scope: &rayon::Scope<'_>) {
    if CANCEL_REQUESTED.load(Ordering::Relaxed) {
        return;
    }
    let Ok(meta) = fs::symlink_metadata(dir) else {
        return;
    };
    state.stats.metadata_calls.fetch_add(1, Ordering::Relaxed);
    if meta.file_type().is_symlink() {
        return;
    }
    if meta.is_dir() {
        if let Ok(mtime) = meta.modified() {
            note_mtime(&state.latest, mtime);
        }
        let Ok(entries) = fs::read_dir(dir) else {
            return;
        };
        state.stats.dirs_enumerated.fetch_add(1, Ordering::Relaxed);
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let state = MeasureState {
                    size: state.size.clone(),
                    count: state.count.clone(),
                    latest: state.latest.clone(),
                    stats: state.stats.clone(),
                };
                let root = root.to_path_buf();
                scope.spawn(move |s| measure_dir(&path, &root, &state, s));
            } else if let Ok(child) = fs::symlink_metadata(&path) {
                state.stats.metadata_calls.fetch_add(1, Ordering::Relaxed);
                if child.is_file() {
                    state.size.fetch_add(child.len(), Ordering::Relaxed);
                    state.count.fetch_add(1, Ordering::Relaxed);
                    state.stats.files_measured.fetch_add(1, Ordering::Relaxed);
                    if let Ok(mtime) = child.modified() {
                        note_mtime(&state.latest, mtime);
                    }
                }
            }
        }
    }
}

/// Records the newer of two modification times.
fn note_mtime(latest: &Mutex<Option<SystemTime>>, mtime: SystemTime) {
    let mut guard = latest
        .lock()
        .unwrap_or_else(std::sync::PoisonError::into_inner);
    match *guard {
        Some(known) if known > mtime => {}
        _ => *guard = Some(mtime),
    }
}

/// Number of measurement workers, i.e. the cap on concurrent disk reads during
/// measurement. Overridable with `CODE_SHREDDER_MEASURE_THREADS` (handy for
/// benchmarking); defaults to `min(available parallelism, 12)`.
///
/// 12 measured as the sweet spot on cold scans: a cache-hot measurement is
/// CPU-bound (metadata served from the page cache), so too few workers
/// regress it, while too many thrash a slow disk. The pool still caps total
/// concurrency regardless of how many directories fan out.
pub(super) fn measure_threads() -> usize {
    if let Ok(value) = std::env::var("CODE_SHREDDER_MEASURE_THREADS") {
        if let Ok(threads) = value.trim().parse::<usize>() {
            return threads.max(1);
        }
    }
    std::thread::available_parallelism()
        .map_or(12, std::num::NonZeroUsize::get)
        .clamp(1, 12)
}

#[cfg(test)]
mod tests {
    use super::super::temp_tree;
    use super::*;

    #[test]
    fn measure_dir_sums_tree_sizes_and_counts() {
        let base = temp_tree("measured");
        let target = base.join("Measured");
        fs::create_dir_all(target.join("nested/deeper")).expect("create target tree");
        fs::write(target.join("a.txt"), vec![0u8; 100]).expect("write a.txt");
        fs::write(target.join("nested/deeper/b.bin"), vec![0u8; 250]).expect("write b.bin");

        let stats = Arc::new(ScanStats::default());
        let measure = MeasureState::new(&stats);
        rayon::scope(|scope| measure_dir(&target, &target, &measure, scope));

        assert_eq!(measure.size.load(Ordering::Relaxed), 350);
        assert_eq!(measure.count.load(Ordering::Relaxed), 2);
        assert_eq!(stats.files_measured.load(Ordering::Relaxed), 2);
        assert!(stats.dirs_enumerated.load(Ordering::Relaxed) >= 2);
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn measure_dir_skips_symlinks() {
        let base = temp_tree("symlink");
        let target = base.join("SymTarget");
        let real = base.join("A/B");
        fs::create_dir_all(&target).expect("create target");
        fs::write(target.join("file.txt"), "x").expect("write file");
        #[cfg(unix)]
        std::os::unix::fs::symlink(&real, target.join("linked-dir")).expect("symlink dir");

        let stats = Arc::new(ScanStats::default());
        let measure = MeasureState::new(&stats);
        rayon::scope(|scope| measure_dir(&target, &target, &measure, scope));

        assert_eq!(measure.size.load(Ordering::Relaxed), 1);
        assert_eq!(measure.count.load(Ordering::Relaxed), 1);
        let _ = fs::remove_dir_all(&base);
    }
}

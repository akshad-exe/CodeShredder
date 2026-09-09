//! Parallel scanner that walks project roots and measures build-output folders.
//!
//! Uses `jwalk` to walk roots in parallel, pruning matched, virtual-environment
//! and protected folders so they are never descended into, and measures each
//! target on a thread from a dedicated, bounded measurement pool, streaming it
//! to a channel as soon as its size is known.
//!
//! Two caches make repeat scans of untouched projects near-instant:
//!
//! - A per-root **discovery snapshot**: the mtime fingerprint of every
//!   directory walked. If the fingerprint matches the previous scan, the
//!   previously discovered targets are replayed without re-walking or
//!   re-measuring anything.
//! - A per-target **size cache**: replayed when a found folder's own metadata
//!   is unchanged and still within the measurement TTL, so re-scanning a
//!   project with a modified sibling skips measuring the untouched folders.
//!
//! The scanner is split into focused submodules:
//!
//! - [`discovery`] — walking roots, building fingerprints, replaying snapshots.
//! - [`measure`] — measuring matched folders on the bounded worker pool.
//! - [`prune`] — which directories the walker skips descending into.
//! - [`roots`] — normalizing and deduplicating the configured scan roots.
//! - [`display`] — path-derived labels for the results list.

pub(crate) mod discovery;
pub(crate) mod display;
pub(crate) mod measure;
pub(crate) mod prune;
pub(crate) mod roots;

use std::collections::HashSet;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc::Sender;
use std::sync::Arc;
use std::time::Instant;

use discovery::walk_root;
use measure::measure_threads;
use roots::normalize_roots;

use crate::domain::pattern::DEFAULT_PATTERNS;
use crate::domain::scan::{ScanInput, ScanTarget};
use crate::storage::cache::ScanCache;

/// Raised when the user asks to stop a running scan. Read (never written) by
/// the walker and the measurer, so it is safe to call from any thread.
pub(super) static CANCEL_REQUESTED: AtomicBool = AtomicBool::new(false);

/// Live scan counters, shared across every root's walker and measurer. All
/// atomics so the parallel walk needs no lock. Read once at the end of a scan
/// for the performance baseline.
#[derive(Debug, Default)]
pub(super) struct ScanStats {
    /// `symlink_metadata` calls paid while walking and measuring.
    pub(super) metadata_calls: AtomicU64,
    /// Directories whose children were enumerated (walked into).
    pub(super) dirs_enumerated: AtomicU64,
    /// Files whose size/count contributed to a measurement.
    pub(super) files_measured: AtomicU64,
    /// Targets streamed to the channel (measured or replayed from cache).
    pub(super) targets_emitted: AtomicU64,
    /// Milliseconds spent discovering (walking roots, building fingerprints).
    pub(super) time_discovering_ms: AtomicU64,
    /// Milliseconds spent measuring matched folders.
    pub(super) time_measuring_ms: AtomicU64,
    /// Milliseconds spent persisting the cache back to disk.
    pub(super) time_saving_ms: AtomicU64,
}

impl ScanStats {
    pub(super) fn log(&self) {
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
    /// The directory discovery walk runs on rayon's global thread pool (jwalk
    /// uses it internally). Measurement runs on a dedicated pool of
    /// `measure_threads()` workers; the pool also receives the per-subdirectory
    /// fan-out, so the number of threads touching the disk during measurement
    /// is bounded regardless of how many targets and directories match.
    ///
    /// # Panics
    ///
    /// Panics when the bounded measurement pool cannot be started.
    pub fn scan_stream(input: &ScanInput, tx: &Sender<ScanTarget>) -> f64 {
        let started = Instant::now();
        CANCEL_REQUESTED.store(false, Ordering::Relaxed);

        let patterns: Arc<HashSet<String>> = Arc::new(build_patterns(input));
        let ignore: Arc<Vec<String>> = Arc::new(build_ignore(input));
        let cache = Arc::new(std::sync::Mutex::new(ScanCache::load()));
        let stats = Arc::new(ScanStats::default());
        let roots = normalize_roots(&input.roots);
        let measure_pool = Arc::new(
            rayon::ThreadPoolBuilder::new()
                .num_threads(measure_threads())
                .thread_name(|index| format!("cs-measure-{index}"))
                .build()
                .expect("failed to start the measurement thread pool"),
        );

        rayon::scope(|scope| {
            for root in roots {
                let tx = tx.clone();
                let patterns = patterns.clone();
                let ignore = ignore.clone();
                let cache = cache.clone();
                let stats = stats.clone();
                let measure_pool = measure_pool.clone();
                scope.spawn(move |_| {
                    walk_root(
                        &root,
                        &patterns,
                        &ignore,
                        &cache,
                        &stats,
                        &measure_pool,
                        &tx,
                    );
                });
            }
        });

        let save_started = Instant::now();
        if let Ok(mut guard) = cache.lock() {
            guard.save();
        }
        ScanStats::add_elapsed_ms(&stats.time_saving_ms, save_started);

        stats.log();

        started.elapsed().as_secs_f64()
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

#[cfg(test)]
/// Creates a throwaway directory tree under the OS temp dir:
/// `{unique}/A/B` and `{unique}/A/C`. `tag` keeps concurrent tests from
/// sharing (and deleting) each other's tree. Returns it without auto-cleanup
/// so the caller controls lifetime.
pub(crate) fn temp_tree(tag: &str) -> std::path::PathBuf {
    let base = std::env::temp_dir().join(format!("cs-scan-root-test-{}-{tag}", std::process::id()));
    let _ = std::fs::remove_dir_all(&base);
    std::fs::create_dir_all(base.join("A/B")).expect("create A/B");
    std::fs::create_dir_all(base.join("A/C")).expect("create A/C");
    base
}

//! Parallel scanner: walks the given roots in parallel, measures matched
//! folders on worker threads and streams each target to a channel as soon as
//! its size is known, so the UI can update live.

use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};
use std::time::{Instant, SystemTime};

use uuid::Uuid;

use crate::domain::pattern::{category_for, is_venv_name, DEFAULT_PATTERNS};
use crate::domain::scan::{ScanInput, ScanTarget};
use crate::services::safety::classify;

/// Raised when the user asks to stop a running scan. Read (never written) by
/// the walker, so it is safe to call from any thread.
static CANCEL_REQUESTED: AtomicBool = AtomicBool::new(false);

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
    /// global thread pool, so a large scan uses every available core.
    pub fn scan_stream(input: &ScanInput, tx: &Sender<ScanTarget>) -> f64 {
        let started = Instant::now();
        CANCEL_REQUESTED.store(false, Ordering::Relaxed);

        let patterns: Arc<HashSet<String>> = Arc::new(build_patterns(input));

        rayon::scope(|scope| {
            for raw in &input.roots {
                let root = expand_root(raw);
                if root.is_dir() {
                    let tx = tx.clone();
                    let patterns = patterns.clone();
                    scope.spawn(move |s| walk_under(&root, patterns, tx, s));
                }
            }
        });

        started.elapsed().as_secs_f64()
    }
}

/// Walks `dir` recursively, spawning tasks for every sub-directory. Any child
/// whose name matches a pattern is measured in parallel and sent to `tx`;
/// matched directories are never descended into. Virtual environment folders
/// are never descended into either, since their internals (`site-packages`,
/// `__pycache__`) are all third-party and cheap to rebuild.
fn walk_under(
    dir: &Path,
    patterns: Arc<HashSet<String>>,
    tx: Sender<ScanTarget>,
    scope: &rayon::Scope<'_>,
) {
    if CANCEL_REQUESTED.load(Ordering::Relaxed) {
        return;
    }
    let name = dir.file_name().and_then(|n| n.to_str()).unwrap_or_default();
    let is_venv = is_venv_name(name);
    if patterns.contains(name) || (is_venv && venv_enabled(&patterns)) {
        let dir = dir.to_path_buf();
        let name = name.to_owned();
        scope.spawn(move |_| {
            let target = measure_target(&dir, &name);
            let _ = tx.send(target);
        });
        return;
    }

    if is_venv {
        return;
    }

    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let tx = tx.clone();
            let patterns = patterns.clone();
            scope.spawn(move |s| walk_under(&path, patterns, tx, s));
        }
    }
}

/// Measures total size, file count and newest modification time under `dir`,
/// walking the tree in parallel via a nested scope.
fn measure_target(dir: &Path, folder_name: &str) -> ScanTarget {
    let size = Arc::new(AtomicU64::new(0));
    let count = Arc::new(AtomicU64::new(0));
    let latest = Arc::new(Mutex::new(None::<SystemTime>));

    rayon::in_place_scope(|scope| {
        measure_under(dir, size.clone(), count.clone(), latest.clone(), scope);
    });

    let project_name = project_root_name(dir, folder_name);

    ScanTarget {
        id: Uuid::new_v4().to_string(),
        path: dir.to_string_lossy().into_owned(),
        display_path: display_path_for(dir, folder_name),
        project_name,
        folder_name: folder_name.to_owned(),
        category: category_for(folder_name).to_owned(),
        size_bytes: size.load(Ordering::Relaxed),
        file_count: count.load(Ordering::Relaxed),
        last_modified: latest.lock().ok().and_then(|guard| *guard).map(format_time),
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
    dt.to_rfc3339_opts(chrono::SecondsFormat::Secs, true)
}

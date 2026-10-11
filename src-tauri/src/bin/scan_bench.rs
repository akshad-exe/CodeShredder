//! Headless scan benchmark used for the before/after performance baseline.
//!
//! Drives the real `ScannerEngine` directly (no Tauri window) so scans can be
//! timed and counted on the same machine and tree across pipeline changes.
//!
//! Usage:
//!
//! ```sh
//! cargo run --release --bin scan_bench -- \
//!   --cache /tmp/scan-cache.json \
//!   --roots ~/Codebase
//! ```
//!
//! Prints the `scan stats` trace record (phase counters) plus a wall-clock
//! summary line. Set `--cache` to a throwaway path for the cold/warm/dirty
//! scenarios so the real app cache is never touched.

use std::sync::mpsc;
use std::sync::Arc;
use std::time::Instant;

use codeshredder_lib::domain::scan::{ScanInput, ScanTarget};
use codeshredder_lib::services::scanner::ScannerEngine;

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let mut cache_path: Option<String> = None;
    let mut roots: Vec<String> = Vec::new();
    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--cache" => {
                i += 1;
                cache_path = args.get(i).cloned();
            }
            "--roots" => {
                for r in &args[i + 1..] {
                    roots.extend(r.split(',').map(str::to_owned));
                }
                break;
            }
            other => roots.extend(other.split(',').map(str::to_owned)),
        }
        i += 1;
    }

    if roots.is_empty() {
        eprintln!("usage: scan_bench --cache <path> --roots <root[,root...]>");
        std::process::exit(2);
    }

    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .init();

    if let Some(path) = cache_path {
        std::env::set_var("CODE_SHREDDER_CACHE", path);
    }

    let input = ScanInput {
        roots,
        patterns: Vec::new(),
        ignore: Vec::new(),
    };

    let (tx, rx) = mpsc::channel::<ScanTarget>();
    let wall = Instant::now();
    let elapsed = ScannerEngine::scan_stream(&input, &tx);
    drop(tx);

    let targets: Arc<Vec<ScanTarget>> = Arc::new(rx.into_iter().collect());
    let total_size: u64 = targets.iter().map(|t| t.size_bytes).sum();

    println!(
        "RESULT targets={} total_size={} scan_stream_s={:.3} wall_s={:.3}",
        targets.len(),
        total_size,
        elapsed,
        wall.elapsed().as_secs_f64(),
    );
}

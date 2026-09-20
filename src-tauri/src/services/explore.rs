//! Scanners for the Explore pages: large files, duplicates and videos.
//!
//! All three reuse the Shred scanner's root normalization
//! (`scanner::roots::normalize_roots`), so the settings' enabled roots behave
//! identically everywhere and nested roots are never walked twice. The walks
//! run on `jwalk`'s parallel walker, matching the rest of the backend.

use std::collections::HashMap;
use std::fs;
use std::io::BufReader;
use std::path::{Path, PathBuf};

use jwalk::WalkDir;
use rayon::prelude::*;
use uuid::Uuid;

use crate::domain::explore::{DuplicateFile, DuplicateGroup, LargeFileEntry, VideoEntry};
use crate::domain::mtime::format_time;
use crate::services::scanner::roots::normalize_roots;

/// Video container extensions recognized by the video scan.
const VIDEO_EXTS: &[&str] = &[
    "mp4", "mkv", "mov", "avi", "wmv", "webm", "flv", "m4v", "mpg", "mpeg", "ts", "3gp",
];

/// A single file walked during a scan, with the metadata Explore pages show.
#[derive(Clone)]
struct WalkedFile {
    path: PathBuf,
    size_bytes: u64,
    modified: Option<String>,
}

/// Collects every regular file under `root` at or above `min_size_bytes`.
/// Unreadable entries are skipped, mirroring the main scanner.
fn collect_files(root: &Path, min_size_bytes: u64) -> Vec<WalkedFile> {
    let mut files = Vec::new();
    for entry in WalkDir::new(root).skip_hidden(false) {
        let Ok(entry) = entry else {
            continue;
        };
        if !entry.file_type.is_file() {
            continue;
        }
        let Ok(meta) = fs::metadata(entry.path()) else {
            continue;
        };
        let size_bytes = meta.len();
        if size_bytes < min_size_bytes {
            continue;
        }
        files.push(WalkedFile {
            path: entry.path(),
            size_bytes,
            modified: meta.modified().ok().map(format_time),
        });
    }
    files
}

/// Lower-case file extension without the dot, or empty when absent.
fn ext_for(path: &Path) -> String {
    path.extension()
        .map_or_else(String::new, |ext| ext.to_string_lossy().to_lowercase())
}

/// Finds the largest files under the given roots.
///
/// Sorted by size, descending, truncated to `limit`.
#[must_use]
pub fn scan_large_files(
    roots: &[String],
    min_size_bytes: u64,
    limit: usize,
) -> Vec<LargeFileEntry> {
    let mut files = Vec::new();
    for root in normalize_roots(roots) {
        files.extend(collect_files(&root, min_size_bytes));
    }
    files.sort_unstable_by_key(|f| std::cmp::Reverse(f.size_bytes));
    files.truncate(limit);

    files
        .into_iter()
        .map(|f| LargeFileEntry {
            id: Uuid::new_v4().to_string(),
            path: f.path.to_string_lossy().into_owned(),
            name: f
                .path
                .file_name()
                .map_or_else(String::new, |n| n.to_string_lossy().into_owned()),
            size_bytes: f.size_bytes,
            modified_at: f.modified,
            ext: ext_for(&f.path),
        })
        .collect()
}

/// Hashes a file's contents. Returns `None` when the file cannot be read.
fn file_digest(path: &Path) -> Option<blake3::Hash> {
    let file = fs::File::open(path).ok()?;
    // `Hasher` implements `io::Write`, so streaming through a buffered reader
    // never materializes the file in memory, even for multi-GB videos.
    blake3::Hasher::new()
        .update_reader(&mut BufReader::new(file))
        .ok()
        .map(|hasher| hasher.finalize())
}

/// Groups identical files by their content hash.
///
/// Only files sharing the same size are ever hashed, and only size groups with
/// two or more members qualify (a singleton can never be a duplicate). The
/// content hash runs on rayon's thread pool like the rest of the scanner.
#[must_use]
pub fn scan_duplicates(roots: &[String], min_size_bytes: u64) -> Vec<DuplicateGroup> {
    let mut by_size: HashMap<u64, Vec<WalkedFile>> = HashMap::new();
    for root in normalize_roots(roots) {
        for file in collect_files(&root, min_size_bytes) {
            by_size.entry(file.size_bytes).or_default().push(file);
        }
    }

    let mut groups: Vec<DuplicateGroup> = Vec::new();
    for (size_bytes, candidates) in by_size {
        if candidates.len() < 2 {
            continue;
        }
        // Hash each candidate in parallel, pairing the digest back to its file.
        let hashed: Vec<(WalkedFile, Option<blake3::Hash>)> = candidates
            .into_par_iter()
            .map(|file| (file.clone(), file_digest(&file.path)))
            .collect();
        let mut by_hash: HashMap<blake3::Hash, Vec<WalkedFile>> = HashMap::new();
        for (file, digest) in hashed {
            if let Some(digest) = digest {
                by_hash.entry(digest).or_default().push(file);
            }
        }
        for members in by_hash.into_values().filter(|m| m.len() > 1) {
            groups.push(DuplicateGroup {
                id: Uuid::new_v4().to_string(),
                size_bytes,
                files: members
                    .into_iter()
                    .map(|f| DuplicateFile {
                        id: Uuid::new_v4().to_string(),
                        path: f.path.to_string_lossy().into_owned(),
                        name: f
                            .path
                            .file_name()
                            .map_or_else(String::new, |n| n.to_string_lossy().into_owned()),
                        modified_at: f.modified,
                    })
                    .collect(),
            });
        }
    }

    // Biggest groups first so the frontend surfaces the most expensive wins.
    groups.sort_unstable_by_key(|g| std::cmp::Reverse(g.size_bytes));
    groups
}

/// Finds video files under the given roots, sorted by size descending.
#[must_use]
pub fn scan_videos(roots: &[String], min_size_bytes: u64) -> Vec<VideoEntry> {
    let mut videos = Vec::new();
    for root in normalize_roots(roots) {
        for file in collect_files(&root, min_size_bytes) {
            let ext = ext_for(&file.path);
            if !VIDEO_EXTS.contains(&ext.as_str()) {
                continue;
            }
            videos.push(VideoEntry {
                id: Uuid::new_v4().to_string(),
                path: file.path.to_string_lossy().into_owned(),
                name: file
                    .path
                    .file_name()
                    .map_or_else(String::new, |n| n.to_string_lossy().into_owned()),
                size_bytes: file.size_bytes,
                ext,
                duration_sec: None,
            });
        }
    }
    videos.sort_unstable_by_key(|v| std::cmp::Reverse(v.size_bytes));
    videos
}

#[cfg(test)]
mod tests {
    use super::super::scanner::temp_tree;
    use super::*;

    fn write_file(path: &Path, contents: &[u8]) {
        std::fs::create_dir_all(path.parent().expect("file has a parent")).expect("create dirs");
        std::fs::write(path, contents).expect("write file");
    }

    fn write_filled(path: &Path, size: usize, fill: u8) {
        std::fs::create_dir_all(path.parent().expect("file has a parent")).expect("create dirs");
        std::fs::write(path, vec![fill; size]).expect("write file");
    }

    #[test]
    fn large_files_finds_largest_sorted_and_truncated() {
        let base = temp_tree("explore-large");
        let big = base.join("A/big.bin");
        write_filled(&big, 1_000, 1);
        let medium = base.join("B/medium.bin");
        write_filled(&medium, 500, 2);
        let small = base.join("A/small.bin");
        write_filled(&small, 100, 3);

        let entries = scan_large_files(&[base.to_string_lossy().into_owned()], 0, 10);
        assert_eq!(
            entries.iter().map(|e| e.size_bytes).collect::<Vec<_>>(),
            vec![1_000, 500, 100]
        );

        let truncated = scan_large_files(&[base.to_string_lossy().into_owned()], 0, 2);
        assert_eq!(truncated.len(), 2);
        assert_eq!(truncated[0].name, "big.bin");

        let filtered = scan_large_files(&[base.to_string_lossy().into_owned()], 600, 10);
        assert_eq!(filtered.len(), 1);
        assert_eq!(filtered[0].name, "big.bin");

        let _ = std::fs::remove_dir_all(&base);
    }

    #[test]
    fn duplicates_groups_identical_content_by_hash() {
        let base = temp_tree("explore-dup");
        let a = base.join("A/same.txt");
        let b = base.join("B/same.txt");
        let c = base.join("A/different.txt");
        write_file(&a, b"identical bytes");
        write_file(&b, b"identical bytes");
        write_filled(&c, 15, 7); // same size, different content

        let groups = scan_duplicates(&[base.to_string_lossy().into_owned()], 0);
        assert_eq!(groups.len(), 1, "only true duplicates form a group");
        assert_eq!(groups[0].files.len(), 2);
        assert_eq!(groups[0].size_bytes, b"identical bytes".len() as u64);

        let _ = std::fs::remove_dir_all(&base);
    }

    #[test]
    fn duplicates_does_not_group_different_content_same_size() {
        let base = temp_tree("explore-dupdiff");
        let a = base.join("A/one.bin");
        let b = base.join("B/two.bin");
        write_filled(&a, 4_096, 1);
        write_filled(&b, 4_096, 2);

        let groups = scan_duplicates(&[base.to_string_lossy().into_owned()], 0);
        assert!(
            groups.is_empty(),
            "same size but different bytes is not a duplicate"
        );

        let _ = std::fs::remove_dir_all(&base);
    }

    #[test]
    fn duplicates_respects_min_size() {
        let base = temp_tree("explore-dupmin");
        let a = base.join("A/same.txt");
        let b = base.join("B/same.txt");
        write_file(&a, b"tiny");
        write_file(&b, b"tiny");

        let none = scan_duplicates(&[base.to_string_lossy().into_owned()], 1_000);
        assert!(none.is_empty(), "files below the threshold are skipped");

        let _ = std::fs::remove_dir_all(&base);
    }

    #[test]
    fn videos_filters_by_extension_and_sorts() {
        let base = temp_tree("explore-vid");
        write_file(&base.join("A/clip.mp4"), &[0u8; 700]);
        write_file(&base.join("B/series.mkv"), &[0u8; 1_000]);
        write_file(&base.join("A/notes.txt"), b"not a video");

        let videos = scan_videos(&[base.to_string_lossy().into_owned()], 0);
        assert_eq!(videos.len(), 2);
        assert_eq!(videos[0].name, "series.mkv");
        assert_eq!(videos[1].ext, "mp4");

        let filtered = scan_videos(&[base.to_string_lossy().into_owned()], 800);
        assert_eq!(filtered.len(), 1);
        assert_eq!(filtered[0].name, "series.mkv");

        let _ = std::fs::remove_dir_all(&base);
    }
}

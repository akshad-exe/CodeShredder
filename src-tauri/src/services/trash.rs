//! Reads the OS Recycle Bin and reports how much storage emptying it reclaims.
//!
//! The `trash` crate reports a directory item's size as a *non-recursive entry
//! count* (`TrashItemSize::Entries`) rather than bytes, which under-counts the
//! claimable space whenever folders sit in the bin. For directory items we walk
//! the item's in-trash payload on disk and sum the real file bytes instead, so
//! the "claimable" figure is accurate.

use std::fs;
use std::path::{Path, PathBuf};

use trash::os_limited::{list, metadata, purge_all, restore_all};
use trash::{TrashItem, TrashItemSize};

use crate::domain::trash::{TrashActionResult, TrashItem as TrashItemDto};

/// Lists every item in the Recycle Bin with accurate reclaimable byte sizes.
pub fn list_items() -> Vec<TrashItemDto> {
    let Ok(items) = list() else {
        return Vec::new();
    };
    items.iter().map(to_dto).collect()
}

fn to_dto(item: &TrashItem) -> TrashItemDto {
    let (size_bytes, entries) = match metadata(item).ok().map(|m| m.size) {
        Some(TrashItemSize::Bytes(bytes)) => (Some(bytes), None),
        Some(TrashItemSize::Entries(count)) => match trash_item_dir_path(item).filter(|p| p.is_dir())
        {
            // Directories: the crate only reports an entry count, so walk the
            // payload to get the real reclaimable bytes and file count.
            Some(dir) => {
                let (bytes, files) = dir_stats(&dir);
                (Some(bytes), Some(files))
            }
            None => (None, Some(count)),
        },
        None => (None, None),
    };
    TrashItemDto {
        id: item.id.to_string_lossy().into_owned(),
        name: item.name.to_string_lossy().into_owned(),
        original_path: item.original_path().to_string_lossy().into_owned(),
        original_parent: item.original_parent.to_string_lossy().into_owned(),
        time_deleted: item.time_deleted,
        size_bytes,
        entries,
    }
}

/// On-disk path of an item's trash payload.
///
/// On Windows `id` is the absolute parsing name of the in-trash `$R` entry, so
/// it is the payload path directly.
#[cfg(target_os = "windows")]
fn trash_item_dir_path(item: &TrashItem) -> Option<PathBuf> {
    Some(PathBuf::from(&item.id))
}

/// On-disk path of an item's trash payload (freedesktop / Linux).
///
/// `id` points at the `.trashinfo` metadata file; the actual payload lives in
/// a sibling `files/` directory under the same name.
#[cfg(all(unix, not(target_os = "macos")))]
fn trash_item_dir_path(item: &TrashItem) -> Option<PathBuf> {
    let info = PathBuf::from(&item.id);
    let name = info
        .file_name()?
        .to_string_lossy()
        .strip_suffix(".trashinfo")?
        .to_owned();
    Some(info.parent()?.parent()?.join("files").join(name))
}

/// Total bytes and file count under `root`, without following symlinks.
fn dir_stats(root: &Path) -> (u64, usize) {
    let mut bytes = 0u64;
    let mut files = 0usize;
    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let Ok(entries) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.flatten() {
            let meta = match fs::symlink_metadata(entry.path()) {
                Ok(m) => m,
                Err(_) => continue,
            };
            if meta.is_dir() {
                stack.push(entry.path());
            } else if meta.is_file() {
                bytes += meta.len();
                files += 1;
            }
        }
    }
    (bytes, files)
}

fn select_by_id(ids: &[String]) -> Option<Vec<TrashItem>> {
    let items = list().ok()?;
    Some(
        items
            .into_iter()
            .filter(|item| ids.contains(&item.id.to_string_lossy().into_owned()))
            .collect(),
    )
}

fn result_for(total: usize, outcome: Result<(), trash::Error>) -> TrashActionResult {
    match outcome {
        Ok(()) => TrashActionResult {
            total,
            succeeded: total,
            failed: 0,
            errors: Vec::new(),
        },
        Err(err) => TrashActionResult {
            total,
            succeeded: 0,
            failed: total,
            errors: vec![err.to_string()],
        },
    }
}

/// Restores the given trash items (by id) to their original locations.
pub fn restore_items(ids: &[String]) -> TrashActionResult {
    match select_by_id(ids) {
        Some(selected) => result_for(selected.len(), restore_all(selected)),
        None => TrashActionResult {
            total: ids.len(),
            succeeded: 0,
            failed: ids.len(),
            errors: vec!["Could not read the trash".to_string()],
        },
    }
}

/// Permanently deletes the given trash items (by id).
pub fn purge_items(ids: &[String]) -> TrashActionResult {
    match select_by_id(ids) {
        Some(selected) => result_for(selected.len(), purge_all(selected)),
        None => TrashActionResult {
            total: ids.len(),
            succeeded: 0,
            failed: ids.len(),
            errors: vec!["Could not read the trash".to_string()],
        },
    }
}

/// Permanently deletes every item in the trash.
pub fn empty_items() -> TrashActionResult {
    let items = match list() {
        Ok(items) => items,
        Err(err) => {
            return TrashActionResult {
                total: 0,
                succeeded: 0,
                failed: 0,
                errors: vec![err.to_string()],
            }
        }
    };
    result_for(items.len(), purge_all(items))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dir_stats_sums_files_recursively() {
        let temp = std::env::temp_dir().join("cs-trash-size");
        std::fs::create_dir_all(temp.join("sub")).unwrap();
        std::fs::write(temp.join("a.bin"), vec![0u8; 512]).unwrap();
        std::fs::write(temp.join("sub/b.bin"), vec![0u8; 1024]).unwrap();
        std::fs::write(temp.join("sub/c.bin"), vec![0u8; 128]).unwrap();
        assert_eq!(dir_stats(&temp), (512 + 1024 + 128, 3));
        let _ = std::fs::remove_dir_all(&temp);
    }

    #[test]
    fn dir_stats_handles_missing_root() {
        let missing = std::env::temp_dir().join("cs-trash-missing");
        assert_eq!(dir_stats(&missing), (0, 0));
    }

    #[test]
    fn list_items_never_panics() {
        // The OS trash may be empty (or a sandbox), but the listing must still
        // return a well-formed vector.
        let items = list_items();
        for item in &items {
            assert!(!item.id.is_empty());
            assert!(!item.name.is_empty());
        }
    }
}

//! Maps a trash item's id to its on-disk payload path, per OS.
//!
//! Each OS stores the payload differently: Windows keeps the item at its id
//! directly, freedesktop hides it under a sibling `files/` directory next to
//! the `.trashinfo` metadata, and macOS exposes no stable payload path — there
//! the caller falls back to the entry count reported by the `trash` crate.
//!
//! The macOS stub exists so this module (and the crate) compiles on macOS,
//! where Delete-to-trash is the only supported operation.

#![cfg_attr(target_os = "macos", allow(dead_code))]

use std::path::PathBuf;

use trash::TrashItem;

/// On-disk path of an item's trash payload.
///
/// On Windows `id` is the absolute parsing name of the in-trash `$R` entry, so
/// it is the payload path directly.
#[cfg(target_os = "windows")]
#[must_use]
pub fn item_dir_path(item: &TrashItem) -> Option<PathBuf> {
    Some(PathBuf::from(&item.id))
}

/// On-disk path of an item's trash payload (freedesktop / Linux).
///
/// `id` points at the `.trashinfo` metadata file; the actual payload lives in
/// a sibling `files/` directory under the same name.
#[cfg(all(unix, not(target_os = "macos")))]
#[must_use]
pub fn item_dir_path(item: &TrashItem) -> Option<PathBuf> {
    let info = PathBuf::from(&item.id);
    let name = info
        .file_name()?
        .to_string_lossy()
        .strip_suffix(".trashinfo")?
        .to_owned();
    Some(info.parent()?.parent()?.join("files").join(name))
}

/// macOS keeps no stable on-disk payload path for trash items (`id` does not
/// resolve to a local file), so callers fall back to the entry count.
#[cfg(target_os = "macos")]
#[must_use]
pub fn item_dir_path(_item: &TrashItem) -> Option<PathBuf> {
    None
}

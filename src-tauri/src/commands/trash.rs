//! Recycle Bin / Trash listing and management commands.

use trash::{
    os_limited::{list, metadata, purge_all, restore_all},
    TrashItem,
};

/// A single item currently in the OS trash.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrashItemDto {
    pub id: String,
    pub name: String,
    pub original_path: String,
    pub original_parent: String,
    pub time_deleted: i64,
    pub size_bytes: Option<u64>,
    pub entries: Option<usize>,
}

/// Result of a restore / purge operation.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrashResult {
    pub total: usize,
    pub succeeded: usize,
    pub failed: usize,
    pub errors: Vec<String>,
}

fn to_dto(item: &TrashItem) -> TrashItemDto {
    let meta = metadata(item).ok();
    let (size_bytes, entries) = match meta {
        Some(m) => (m.size.size(), m.size.entries()),
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

/// Lists every item currently in the OS Trash / Recycle Bin.
#[tauri::command]
pub fn list_trash() -> Result<Vec<TrashItemDto>, String> {
    let items = list().map_err(|e| e.to_string())?;
    Ok(items.iter().map(to_dto).collect())
}

/// Restores the given trash items (by id) to their original locations.
#[tauri::command]
pub fn restore_trash(ids: Vec<String>) -> TrashResult {
    let Ok(items) = list() else {
        return TrashResult {
            total: ids.len(),
            succeeded: 0,
            failed: ids.len(),
            errors: vec!["Could not read the trash".to_string()],
        };
    };
    let selected: Vec<TrashItem> = items
        .into_iter()
        .filter(|item| ids.contains(&item.id.to_string_lossy().into_owned()))
        .collect();

    let total = selected.len();
    let (succeeded, failed, errors) = match restore_all(selected) {
        Ok(()) => (total, 0, Vec::new()),
        Err(err) => {
            let msg = err.to_string();
            (0, total, vec![msg])
        }
    };

    TrashResult {
        total,
        succeeded,
        failed,
        errors,
    }
}

/// Permanently deletes the given trash items (by id).
#[tauri::command]
pub fn purge_trash(ids: Vec<String>) -> TrashResult {
    let Ok(items) = list() else {
        return TrashResult {
            total: ids.len(),
            succeeded: 0,
            failed: ids.len(),
            errors: vec!["Could not read the trash".to_string()],
        };
    };
    let selected: Vec<TrashItem> = items
        .into_iter()
        .filter(|item| ids.contains(&item.id.to_string_lossy().into_owned()))
        .collect();

    let total = selected.len();
    let (succeeded, failed, errors) = match purge_all(selected) {
        Ok(()) => (total, 0, Vec::new()),
        Err(err) => {
            let msg = err.to_string();
            (0, total, vec![msg])
        }
    };

    TrashResult {
        total,
        succeeded,
        failed,
        errors,
    }
}

/// Permanently deletes every item in the trash.
#[tauri::command]
pub fn empty_trash() -> TrashResult {
    let Ok(items) = list() else {
        return TrashResult {
            total: 0,
            succeeded: 0,
            failed: 0,
            errors: vec!["Could not read the trash".to_string()],
        };
    };
    let total = items.len();
    match purge_all(items) {
        Ok(()) => TrashResult {
            total,
            succeeded: total,
            failed: 0,
            errors: Vec::new(),
        },
        Err(err) => TrashResult {
            total,
            succeeded: 0,
            failed: total,
            errors: vec![err.to_string()],
        },
    }
}

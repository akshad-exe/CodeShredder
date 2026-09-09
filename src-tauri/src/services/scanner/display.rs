//! Path-derived labels for the results list.

use std::path::Path;

/// The project root folder name, e.g. `CodeShredder` for
/// `.../CodeShredder/src-tauri/target` or `Kiko` for `.../Kiko/node_modules`.
/// `target` folders sit two levels down (project root -> crate -> target), so
/// they look one level further up than everything else.
pub(super) fn project_root_name(dir: &Path, folder_name: &str) -> String {
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
pub(super) fn display_path_for(dir: &Path, folder_name: &str) -> String {
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

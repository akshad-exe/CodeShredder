//! Which directories the walker skips descending into.

use std::collections::HashSet;
use std::path::Path;

use jwalk::DirEntry;

use crate::domain::pattern::is_venv_name;
use crate::services::safety::is_protected;

/// Folder names that are never interesting to scan inside, even when they
/// match a pattern (a found `node_modules` contains only nested
/// `node_modules`).
const NO_JUNK_DIRS: &[&str] = &[
    "node_modules",
    "dist",
    "build",
    ".next",
    "out",
    "target",
    ".venv",
    "venv",
    ".git",
    ".hg",
    ".svn",
    ".cache",
    "__pycache__",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".tox",
    ".eggs",
    ".yarn",
    ".pnpm-store",
    "vendor",
];

/// Replaces the children list with one whose directories are pruned from the
/// walk: matched nodes, virtual environments, duplicate-junk folders and
/// protected system paths are never descended into.
pub(super) fn prune_children(
    patterns: &HashSet<String>,
    ignore: &[String],
    children: &mut [jwalk::Result<DirEntry<((), ())>>],
) {
    for entry in children.iter_mut().flatten() {
        if entry.file_type.is_dir() {
            let name = entry.file_name.to_string_lossy();
            let is_venv = is_venv_name(&name);
            if patterns.contains(name.as_ref())
                || is_venv
                || NO_JUNK_DIRS.contains(&name.as_ref())
                || is_ignored(&entry.path(), &name, ignore)
                || is_protected(&entry.path())
            {
                entry.read_children_path = None;
            }
        }
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

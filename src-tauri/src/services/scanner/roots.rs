//! Normalizing and deduplicating the configured scan roots.

use std::fs;
use std::path::PathBuf;

/// Expands a leading `~/` to the user's home directory, trimming whitespace.
fn expand_root(raw: &str) -> PathBuf {
    let trimmed = raw.trim();
    if let Some(rest) = trimmed.strip_prefix("~/") {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(home).join(rest);
        }
    }
    PathBuf::from(trimmed)
}

/// Normalizes the scan roots into one effective, deduplicated set:
///
/// - canonicalizes each root (falling back to the expanded path when
///   canonicalization fails, e.g. on some network/removable drives),
/// - keeps only existing directories,
/// - drops duplicate roots,
/// - drops any root that is a descendant of another root in the set, so
///   nested roots never scan the same files twice (e.g. `~/Code` and
///   `~/Code/ProjectX` would otherwise double-walk `ProjectX`).
pub fn normalize_roots(raw: &[String]) -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = Vec::new();
    for raw_root in raw {
        let expanded = expand_root(raw_root);
        let canonical = fs::canonicalize(&expanded).unwrap_or(expanded);
        if canonical.is_dir() && !roots.contains(&canonical) {
            roots.push(canonical);
        }
    }

    // Shortest-first so an ancestor always precedes its descendants.
    roots.sort_by_key(|p| p.components().count());

    let mut top: Vec<PathBuf> = Vec::new();
    for root in roots {
        if top.iter().any(|t| root.starts_with(t)) {
            continue;
        }
        top.push(root);
    }

    tracing::debug!(roots = ?top, "normalized scan roots");
    top
}

#[cfg(test)]
mod tests {
    use super::super::temp_tree;
    use super::*;

    #[test]
    fn normalize_roots_dedupes_identical_paths() {
        let base = temp_tree("dedup");
        let root = base.join("A/B");
        let normalized = normalize_roots(&[
            root.to_string_lossy().into_owned(),
            root.to_string_lossy().into_owned(),
        ]);
        assert_eq!(normalized, vec![root]);
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn normalize_roots_drops_nested_roots() {
        let base = temp_tree("nested");
        let nested = base.join("A/B").to_string_lossy().into_owned();
        let parent = base.join("A").to_string_lossy().into_owned();
        let normalized = normalize_roots(&[nested, parent]);
        // The ancestor must win; the descendant root is skipped.
        assert_eq!(normalized, vec![base.join("A")]);
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn normalize_roots_skips_missing_dirs() {
        let base = temp_tree("missing");
        let missing = base.join("does-not-exist").to_string_lossy().into_owned();
        let real = base.join("A").to_string_lossy().into_owned();
        let normalized = normalize_roots(&[missing, real]);
        assert_eq!(normalized, vec![base.join("A")]);
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn normalize_roots_keeps_siblings() {
        let base = temp_tree("siblings");
        let a = base.join("A").to_string_lossy().into_owned();
        let member = base.join("A/B").to_string_lossy().into_owned();
        let sibling = base.join("sibling");
        fs::create_dir_all(&sibling).expect("create sibling");
        let sibling_s = sibling.to_string_lossy().into_owned();
        let normalized = normalize_roots(&[a, member, sibling_s]);
        assert_eq!(normalized, vec![base.join("A"), sibling]);
        let _ = fs::remove_dir_all(&base);
    }
}

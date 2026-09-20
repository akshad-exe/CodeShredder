//! Project-root detection and path-derived labels for the results list.

use std::path::{Path, PathBuf};

/// Manifest and lockfile names that mark a project root, used only when the
/// tree is not inside a git repository. Every ecosystem ships a manifest file
/// (and usually a lockfile too), so either one is enough to identify the
/// project boundary by walking up the ancestors.
const PROJECT_MARKERS: &[&str] = &[
    // JavaScript / Node / Bun
    "package.json",
    "package-lock.json",
    "npm-shrinkwrap.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "bun.lock",
    "bun.lockb",
    // Python
    "pyproject.toml",
    "uv.lock",
    "poetry.lock",
    "setup.py",
    "requirements.txt",
    "Pipfile",
    "Pipfile.lock",
    // Rust
    "Cargo.toml",
    "Cargo.lock",
    // Go
    "go.mod",
    "go.sum",
    // Java / Gradle / Maven
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "settings.gradle",
    "settings.gradle.kts",
    "gradle.lockfile",
    // C# / .NET (project files also matched by extension below)
    "packages.lock.json",
    // Ruby
    "Gemfile",
    "Gemfile.lock",
    // PHP
    "composer.json",
    "composer.lock",
    // Dart / Flutter
    "pubspec.yaml",
    "pubspec.lock",
    // Elixir
    "mix.exs",
    "mix.lock",
    // Swift / iOS
    "Package.swift",
    "Package.resolved",
    "Podfile",
    "Podfile.lock",
    // Modern web framework configs living next to package.json
    "next.config.js",
    "next.config.mjs",
    "next.config.ts",
    "vite.config.js",
    "vite.config.mjs",
    "vite.config.ts",
    "nuxt.config.ts",
];

/// Suffix-based project markers whose names vary per project: .NET/Azure
/// project files (`.csproj`, ...) and Xcode bundles (`.xcodeproj`). Matched by
/// suffix rather than listed literally.
const PROJECT_FILE_SUFFIXES: &[&str] = &[
    ".csproj",
    ".fsproj",
    ".vbproj",
    ".sln",
    ".slnx",
    ".xcodeproj",
    ".xcworkspace",
];

/// A `.git` entry — either a directory (normal checkouts) or a plain file
/// (worktrees and submodules pin their git dir via `gitdir:`).
fn has_git(dir: &Path) -> bool {
    dir.join(".git").exists()
}

/// Whether the directory declares itself a project root via any manifest or
/// lockfile (or an extension-based project file / Xcode bundle).
fn has_project_marker(dir: &Path) -> bool {
    if PROJECT_MARKERS.iter().any(|m| dir.join(m).is_file()) {
        return true;
    }
    let Ok(entries) = std::fs::read_dir(dir) else {
        return false;
    };
    entries.flatten().any(|e| {
        let name = e.file_name();
        let name = name.to_string_lossy();
        PROJECT_FILE_SUFFIXES
            .iter()
            .any(|suffix| name.ends_with(suffix))
    })
}

/// The project root that owns the target folder, e.g. `.../CodeShredder` for
/// `.../CodeShredder/src-tauri/target` or `.../Kiko` for `.../Kiko/node_modules`.
///
/// Resolution order, walking up from the junk folder:
/// 1. the nearest ancestor containing `.git` — a monorepo is one project, and a
///    nested checkout (submodule / worktree) is its own project;
/// 2. otherwise (uninited repos) the nearest ancestor with a manifest/lockfile
///    for its ecosystem;
/// 3. otherwise the legacy fixed-depth guess.
///
/// The full path is the grouping key for the "by project" view.
pub(super) fn project_root_path(dir: &Path, folder_name: &str) -> PathBuf {
    let mut git_root = None;
    let mut marker_root = None;
    for ancestor in dir.ancestors() {
        if has_git(ancestor) {
            git_root = Some(ancestor);
            break;
        }
        if marker_root.is_none() && has_project_marker(ancestor) {
            marker_root = Some(ancestor);
        }
    }
    if let Some(root) = git_root.or(marker_root) {
        return root.to_path_buf();
    }
    legacy_root(dir, folder_name)
}

/// Depth-based fallback used only when no git boundary or project marker exists
/// anywhere up the tree. `target` folders sit two levels down (project root ->
/// crate -> target), everything else one level down.
fn legacy_root(dir: &Path, folder_name: &str) -> PathBuf {
    let depth = if folder_name == "target" { 2 } else { 1 };
    dir.ancestors()
        .nth(depth)
        .unwrap_or_else(|| dir.parent().unwrap_or(dir))
        .to_path_buf()
}

/// The project root folder name, e.g. `CodeShredder` for
/// `.../CodeShredder/src-tauri/target` or `Kiko` for `.../Kiko/node_modules`.
pub(super) fn project_root_name(dir: &Path, folder_name: &str) -> String {
    project_root_path(dir, folder_name)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or_default()
        .to_owned()
}

/// Short path shown in the results list, e.g. `CodeShredder\src-tauri\target`
/// for a `target` folder or `Kiko\node_modules` for a `node_modules` folder.
/// The project root segment leads so the frontend can drop it when rendering
/// rows inside a project's grouped block.
pub(super) fn display_path_for(dir: &Path, folder_name: &str) -> String {
    let root = project_root_path(dir, folder_name);
    let mut parts: Vec<&str> = Vec::new();
    if let Some(name) = root.file_name().and_then(|n| n.to_str()) {
        parts.push(name);
    }
    if let Ok(rel) = dir.strip_prefix(&root) {
        for comp in rel.components() {
            if let std::path::Component::Normal(seg) = comp {
                if let Some(seg) = seg.to_str() {
                    parts.push(seg);
                }
            }
        }
    }
    if parts.is_empty() {
        dir.to_string_lossy().into_owned()
    } else {
        parts.join(std::path::MAIN_SEPARATOR_STR)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::scanner::temp_tree;

    fn write_file(path: &Path, contents: &str) {
        std::fs::create_dir_all(path.parent().expect("file has a parent")).expect("create dirs");
        std::fs::write(path, contents).expect("write file");
    }

    #[test]
    fn git_root_wins_over_manifests() {
        let base = temp_tree("display-git");
        std::fs::create_dir_all(base.join(".git")).expect("git dir");
        write_file(&base.join("package.json"), "{}");
        std::fs::create_dir_all(base.join("app/node_modules")).expect("node_modules");

        let root = project_root_path(&base.join("app/node_modules"), "node_modules");
        assert_eq!(root, base, "repo root beats a nested manifest");

        let _ = std::fs::remove_dir_all(&base);
    }

    #[test]
    fn nearest_nested_git_wins() {
        let base = temp_tree("display-nested");
        std::fs::create_dir_all(base.join(".git")).expect("outer git");
        std::fs::create_dir_all(base.join("lib/.git")).expect("submodule git");
        std::fs::create_dir_all(base.join("lib/target")).expect("target");

        let root = project_root_path(&base.join("lib/target"), "target");
        assert_eq!(
            root,
            base.join("lib"),
            "a nested checkout is its own project"
        );

        let _ = std::fs::remove_dir_all(&base);
    }

    #[test]
    fn worktree_git_file_counts_as_root() {
        let base = temp_tree("display-worktree");
        write_file(&base.join(".git"), "gitdir: /elsewhere/real.git\n");
        std::fs::create_dir_all(base.join("app/node_modules")).expect("node_modules");

        let root = project_root_path(&base.join("app/node_modules"), "node_modules");
        assert_eq!(
            root, base,
            "a .git file (worktree/submodule) marks the root"
        );

        let _ = std::fs::remove_dir_all(&base);
    }

    #[test]
    fn manifest_fallback_without_git() {
        let base = temp_tree("display-manifest");
        write_file(&base.join("package.json"), "{}");
        std::fs::create_dir_all(base.join("A/B/node_modules")).expect("node_modules");

        let root = project_root_path(&base.join("A/B/node_modules"), "node_modules");
        assert_eq!(root, base, "package.json marks an uninited repo's root");

        let crate_dir = base.join("app/src-tauri");
        write_file(&crate_dir.join("Cargo.toml"), "[package]\n");
        std::fs::create_dir_all(crate_dir.join("target")).expect("target");

        let root = project_root_path(&crate_dir.join("target"), "target");
        assert_eq!(root, crate_dir, "Cargo.toml marks a Rust crate root");

        let _ = std::fs::remove_dir_all(&base);
    }

    #[test]
    fn dotnet_and_xcode_markers_mark_roots() {
        let base = temp_tree("display-external");
        // NOTE: no `.git` here on purpose — these markers are the non-git fallback.

        let cs = base.join("cs");
        write_file(&cs.join("App.csproj"), "<Project/>");
        std::fs::create_dir_all(cs.join("bin")).expect("bin");
        assert_eq!(
            project_root_path(&cs.join("bin"), "bin"),
            cs,
            "a .csproj file marks the project root"
        );

        let ios = base.join("ios");
        std::fs::create_dir_all(ios.join("MyApp.xcodeproj")).expect("xcodeproj");
        std::fs::create_dir_all(ios.join("app/Pods")).expect("pods");
        assert_eq!(
            project_root_path(&ios.join("app/Pods"), "Pods"),
            ios,
            "an .xcodeproj directory marks the project root"
        );

        let _ = std::fs::remove_dir_all(&base);
    }

    #[test]
    fn legacy_depth_fallback_without_any_marker() {
        let base = temp_tree("display-legacy");
        let node_modules = base.join("plain/deep/node_modules");
        std::fs::create_dir_all(&node_modules).expect("node_modules");

        let root = project_root_path(&node_modules, "node_modules");
        assert_eq!(
            root,
            node_modules.parent().unwrap(),
            "falls back one level up"
        );

        let target = base.join("plain/src-tauri/target");
        std::fs::create_dir_all(&target).expect("target");
        let root = project_root_path(&target, "target");
        assert_eq!(root, base.join("plain"), "target falls back two levels up");

        let _ = std::fs::remove_dir_all(&base);
    }

    #[test]
    fn display_path_is_project_relative() {
        let base = temp_tree("display-rel");
        std::fs::create_dir_all(base.join(".git")).expect("git dir");
        std::fs::create_dir_all(base.join("src-tauri/target")).expect("target");

        let sep = std::path::MAIN_SEPARATOR;
        let name = base
            .file_name()
            .expect("name")
            .to_string_lossy()
            .into_owned();
        let path = display_path_for(&base.join("src-tauri/target"), "target");
        assert_eq!(path, format!("{name}{sep}src-tauri{sep}target"));

        let _ = std::fs::remove_dir_all(&base);
    }
}

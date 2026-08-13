//! Discovers global package-manager caches and measures their size.
//!
//! These are the system-wide "heavy hitters" that live outside any single
//! project: npm/yarn/pnpm store, pip wheels, cargo registry, maven/gradle
//! repositories, NuGet packages, Go module cache and Composer archives. Each
//! one is resolvable from the user's home (or LOCALAPPDATA on Windows) and is
//! rebuildable, so clearing them frees tens of gigabytes safely.
//!
//! Path resolution and the size walk are intentionally simple and dependency
//! free (std + jwalk), matching the rest of the services.

use std::path::{Path, PathBuf};

use jwalk::WalkDir;

use crate::domain::caches::{CacheEntry, CacheSafety};

/// A candidate cache location: identity plus one or more absolute paths (first
/// existing wins, so the same spec can resolve differently per OS).
struct CacheSpec {
    id: &'static str,
    name: &'static str,
    category: &'static str,
    safety: CacheSafety,
    candidates: Vec<PathBuf>,
}

/// Lists every present global package-manager cache with its size in bytes.
/// Only caches that actually exist on disk are returned.
pub fn list_caches() -> Vec<CacheEntry> {
    cache_specs()
        .into_iter()
        .filter_map(|spec| {
            let path = first_existing(&spec.candidates)?;
            Some(CacheEntry {
                id: spec.id.to_owned(),
                name: spec.name.to_owned(),
                path: path.to_string_lossy().into_owned(),
                size_bytes: dir_size(&path),
                category: spec.category.to_owned(),
                safety: spec.safety.as_str().to_owned(),
            })
        })
        .collect()
}

/// All known package-manager caches, ordered from the biggest offenders to the
/// smaller ones.
fn cache_specs() -> Vec<CacheSpec> {
    let mut specs = Vec::new();
    let push = |specs: &mut Vec<CacheSpec>,
                id: &'static str,
                name: &'static str,
                category: &'static str,
                safety: CacheSafety,
                candidates: Vec<PathBuf>| {
        specs.push(CacheSpec {
            id,
            name,
            category,
            safety,
            candidates,
        });
    };

    push(
        &mut specs,
        "npm",
        "npm cache",
        "Node.js",
        CacheSafety::Safe,
        candidates(&[home(".npm/_cacache"), local("npm-cache/_cacache"), local("npm-cache")]),
    );
    push(
        &mut specs,
        "yarn",
        "yarn cache",
        "Node.js",
        CacheSafety::Safe,
        candidates(&[home(".cache/yarn"), local("Yarn/Cache")]),
    );
    push(
        &mut specs,
        "yarn-berry",
        "yarn berry cache",
        "Node.js",
        CacheSafety::Safe,
        candidates(&[home(".yarn/berry/cache"), local("Yarn/berry/cache")]),
    );
    push(
        &mut specs,
        "pnpm",
        "pnpm store",
        "Node.js",
        CacheSafety::Safe,
        candidates(&[home(".local/share/pnpm/store"), local("pnpm/store")]),
    );
    push(
        &mut specs,
        "pip",
        "pip cache",
        "Python",
        CacheSafety::Safe,
        candidates(&[home(".cache/pip"), home("Library/Caches/pip"), local("pip/Cache")]),
    );
    push(
        &mut specs,
        "cargo",
        "cargo registry",
        "Rust",
        CacheSafety::Medium,
        candidates(&[home(".cargo/registry")]),
    );
    push(
        &mut specs,
        "maven",
        "maven repository",
        "Java",
        CacheSafety::Medium,
        candidates(&[home(".m2/repository")]),
    );
    push(
        &mut specs,
        "gradle",
        "gradle caches",
        "Java",
        CacheSafety::Medium,
        candidates(&[home(".gradle/caches")]),
    );
    push(
        &mut specs,
        "nuget",
        "NuGet packages",
        ".NET",
        CacheSafety::Medium,
        candidates(&[home(".nuget/packages")]),
    );
    push(
        &mut specs,
        "go",
        "go module cache",
        "Go",
        CacheSafety::Medium,
        candidates(&[home("go/pkg/mod/cache")]),
    );
    push(
        &mut specs,
        "composer",
        "composer cache",
        "PHP",
        CacheSafety::Safe,
        candidates(&[home(".composer/cache"), home("AppData/Roaming/Composer/cache")]),
    );
    push(
        &mut specs,
        "user-temp",
        "user temp files",
        "System",
        CacheSafety::Safe,
        candidates(&[Some(std::env::temp_dir()), local("Temp")]),
    );
    push(
        &mut specs,
        "windows-temp",
        "Windows temp files",
        "System",
        CacheSafety::Medium,
        candidates(&[
            winvar("WINDIR", "Temp"),
            Some(PathBuf::from(r"C:\Windows\Temp")),
        ]),
    );
    push(
        &mut specs,
        "windows-update",
        "Windows Update cache",
        "System",
        CacheSafety::Medium,
        candidates(&[
            winvar("WINDIR", r"SoftwareDistribution\Download"),
            Some(PathBuf::from(r"C:\Windows\SoftwareDistribution\Download")),
        ]),
    );
    push(
        &mut specs,
        "prefetch",
        "Windows prefetch",
        "System",
        CacheSafety::Medium,
        candidates(&[winvar("WINDIR", "Prefetch"), Some(PathBuf::from(r"C:\Windows\Prefetch"))]),
    );
    push(
        &mut specs,
        "inet-cache",
        "Internet cache",
        "System",
        CacheSafety::Safe,
        candidates(&[local(r"Microsoft\Windows\INetCache")]),
    );
    push(
        &mut specs,
        "crash-dumps",
        "crash dumps",
        "System",
        CacheSafety::Safe,
        candidates(&[local("CrashDumps")]),
    );
    push(
        &mut specs,
        "d3d-shader-cache",
        "D3D shader cache",
        "System",
        CacheSafety::Safe,
        candidates(&[local("D3DSCache")]),
    );
    push(
        &mut specs,
        "chrome-cache",
        "Chrome cache",
        "Browsers",
        CacheSafety::Safe,
        candidates(&[local(r"Google\Chrome\User Data\Default\Cache")]),
    );
    push(
        &mut specs,
        "edge-cache",
        "Edge cache",
        "Browsers",
        CacheSafety::Safe,
        candidates(&[local(r"Microsoft\Edge\User Data\Default\Cache")]),
    );

    specs
}

/// Joins a home-relative path on the current platform. Returns `None` when the
/// home directory cannot be resolved or on the wrong OS.
#[cfg(not(target_os = "windows"))]
fn home(rel: &str) -> Option<PathBuf> {
    std::env::var_os("HOME").map(|home| PathBuf::from(home).join(rel))
}

#[cfg(target_os = "windows")]
fn home(rel: &str) -> Option<PathBuf> {
    std::env::var_os("USERPROFILE").map(|home| PathBuf::from(home).join(rel))
}

/// Joins a LOCALAPPDATA-relative path (Windows cache locations). Always `None`
/// on other platforms.
#[cfg(target_os = "windows")]
fn local(rel: &str) -> Option<PathBuf> {
    std::env::var_os("LOCALAPPDATA").map(|root| PathBuf::from(root).join(rel))
}

#[cfg(not(target_os = "windows"))]
fn local(_rel: &str) -> Option<PathBuf> {
    None
}

/// Joins a Windows env-var-relative path (e.g. `%WINDIR%`). Always `None` on
/// other platforms.
#[cfg(target_os = "windows")]
fn winvar(name: &str, rel: &str) -> Option<PathBuf> {
    std::env::var_os(name).map(|root| PathBuf::from(root).join(rel))
}

#[cfg(not(target_os = "windows"))]
fn winvar(_name: &str, _rel: &str) -> Option<PathBuf> {
    None
}

/// Returns the platform-resolvable candidates, dropping the ones that can't
/// exist on this OS (e.g. LOCALAPPDATA paths on Linux).
fn candidates(items: &[Option<PathBuf>]) -> Vec<PathBuf> {
    items.iter().flatten().cloned().collect()
}

/// Returns the first candidate that exists as a directory.
fn first_existing(candidates: &[PathBuf]) -> Option<PathBuf> {
    candidates.iter().find(|p| p.is_dir()).cloned()
}

/// Total size in bytes of every regular file under `root`, walked in parallel
/// via jwalk. Symlinks are not followed and their links are not counted.
fn dir_size(root: &Path) -> u64 {
    WalkDir::new(root)
        .skip_hidden(false)
        .into_iter()
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_type.is_file())
        .map(|entry| {
            std::fs::symlink_metadata(entry.path())
                .map(|meta| meta.len())
                .unwrap_or(0)
        })
        .sum()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn first_existing_picks_first_dir() {
        let temp = std::env::temp_dir().join("cs-cache-test");
        std::fs::create_dir_all(&temp).unwrap();
        let missing = temp.join("nope");
        assert_eq!(
            first_existing(&[missing.clone(), temp.clone()]),
            Some(temp.clone())
        );
        assert_eq!(first_existing(std::slice::from_ref(&missing)), None);
        let _ = std::fs::remove_dir_all(&temp);
    }

    #[test]
    fn dir_size_sums_files_recursively() {
        let temp = std::env::temp_dir().join("cs-cache-size");
        std::fs::create_dir_all(temp.join("sub")).unwrap();
        std::fs::write(temp.join("a.bin"), vec![0u8; 512]).unwrap();
        std::fs::write(temp.join("sub/b.bin"), vec![0u8; 1024]).unwrap();
        assert_eq!(dir_size(&temp), 512 + 1024);
        let _ = std::fs::remove_dir_all(&temp);
    }

    #[test]
    fn missing_cache_is_skipped() {
        // No HOME is guaranteed in CI, but when it exists we only expect a
        // consistent, filterable list back (never a panic on missing dirs).
        let entries = list_caches();
        for entry in &entries {
            assert!(!entry.path.is_empty());
            assert!(std::path::Path::new(&entry.path).is_dir());
        }
    }
}

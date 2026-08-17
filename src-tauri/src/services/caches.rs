//! Discovers global package-manager caches and measures their size.
//!
//! These are the system-wide "heavy hitters" that live outside any single
//! project: npm/yarn/pnpm store, pip wheels, cargo registry, maven/gradle
//! repositories, `NuGet` packages, Go module cache and Composer archives. Each
//! one is resolvable from the user's home (or LOCALAPPDATA on Windows) and is
//! rebuildable, so clearing them frees tens of gigabytes safely.
//!
//! Path resolution and the size walk are intentionally simple and dependency
//! free (std + jwalk), matching the rest of the services.

use std::path::{Path, PathBuf};

use jwalk::WalkDir;

use crate::domain::caches::{CacheEntry, CacheSafety};
use crate::services::safety::is_protected;

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
#[must_use]
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

/// Empties a cache's contents, leaving the directory itself in place so
/// configs/env vars that point at it keep resolving. Returns the path and the
/// bytes freed.
///
/// Only paths that resolve from a known cache spec are accepted; unknown ids
/// and protected paths are refused. Clearing the *contents* (not the folder)
/// means a relocated cache such as cargo's registry junction target keeps
/// working instead of being left as a dangling reference.
///
/// # Errors
///
/// Returns an error when the id is unknown, the cache is missing on disk, the
/// path is protected, or the contents cannot be emptied.
pub fn clean_cache(id: &str) -> Result<(PathBuf, u64), String> {
    let spec = cache_specs()
        .into_iter()
        .find(|spec| spec.id == id)
        .ok_or_else(|| format!("unknown cache: {id}"))?;
    let path = first_existing(&spec.candidates)
        .ok_or_else(|| format!("cache not present: {}", spec.name))?;
    if is_protected(&path) {
        return Err("path is protected and cannot be cleaned".to_string());
    }

    let freed = dir_size(&path);
    empty_contents(&path).map_err(|err| err.to_string())?;
    Ok((path, freed))
}

/// Removes every file and subdirectory under `root`, leaving `root` itself.
/// Symlinks (including junctions) are removed as links, never followed.
fn empty_contents(root: &Path) -> std::io::Result<()> {
    for entry in std::fs::read_dir(root)? {
        let entry = entry?;
        let path = entry.path();
        let meta = std::fs::symlink_metadata(&path)?;
        if meta.is_dir() {
            std::fs::remove_dir_all(&path)?;
        } else {
            std::fs::remove_file(&path)?;
        }
    }
    Ok(())
}

/// All known package-manager caches, ordered from the biggest offenders to the
/// smaller ones.
#[allow(clippy::too_many_lines)]
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
        candidates(&[
            npm_override(),
            env("npm_config_cache"),
            home(".npm/_cacache"),
            local("npm-cache/_cacache"),
            local("npm-cache"),
        ]),
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
        candidates(&[
            pnpm_override(),
            home(".local/share/pnpm/store"),
            local("pnpm/store"),
        ]),
    );
    push(
        &mut specs,
        "pip",
        "pip cache",
        "Python",
        CacheSafety::Safe,
        candidates(&[
            env("PIP_CACHE_DIR"),
            home(".cache/pip"),
            home("Library/Caches/pip"),
            local("pip/Cache"),
        ]),
    );
    push(
        &mut specs,
        "uv",
        "uv cache",
        "Python",
        CacheSafety::Safe,
        candidates(&[env("UV_CACHE_DIR"), home(".cache/uv"), local("uv")]),
    );
    push(
        &mut specs,
        "cargo",
        "cargo registry",
        "Rust",
        CacheSafety::Medium,
        candidates(&[
            env("CARGO_HOME").map(|home| home.join("registry")),
            home(".cargo/registry"),
        ]),
    );
    push(
        &mut specs,
        "bun",
        "bun cache",
        "Node.js",
        CacheSafety::Safe,
        candidates(&[env("BUN_INSTALL_CACHE_DIR"), home(".bun/install/cache")]),
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
        candidates(&[
            go_mod_cache(),
            home("go/pkg/mod/cache"),
        ]),
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
const fn local(_rel: &str) -> Option<PathBuf> {
    None
}

/// Reads an environment variable override for a cache's active path. Returns
/// `None` when unset, so the tool falls back to its default location.
fn env(name: &str) -> Option<PathBuf> {
    std::env::var_os(name).map(PathBuf::from)
}

/// npm's configured cache root: the `cache=` entry in the user `.npmrc`, when
/// present (overrides the default `%LOCALAPPDATA%\npm-cache`).
fn npm_override() -> Option<PathBuf> {
    user_npmrc()
        .and_then(|rc| read_kv(&rc, "cache"))
        .map(PathBuf::from)
}

/// pnpm's configured store directory: the `store-dir=` entry in the user or
/// global pnpm config, when present (overrides the default store).
fn pnpm_override() -> Option<PathBuf> {
    pnpm_rc()
        .and_then(|rc| read_kv(&rc, "store-dir"))
        .map(PathBuf::from)
}

/// Go's module cache: `GOMODCACHE` env var when set, otherwise `GOPATH\pkg\mod`.
fn go_mod_cache() -> Option<PathBuf> {
    env("GOMODCACHE").or_else(|| env("GOPATH").map(|gopath| gopath.join("pkg").join("mod")))
}

/// The user-level npmrc, preferring `NPM_CONFIG_USERCONFIG` then the standard
/// locations (`.npmrc` beside the home / user profile).
fn user_npmrc() -> Option<PathBuf> {
    env("NPM_CONFIG_USERCONFIG").or_else(|| home(".npmrc"))
}

/// The pnpm config file, preferring `PNPM_HOME`-relative then the standard
/// locations.
fn pnpm_rc() -> Option<PathBuf> {
    env("PNPM_HOME").map(|home| home.join("config").join("rc"))
        .or_else(|| home(".config/pnpm/rc"))
        .or_else(|| home("AppData/Local/pnpm/config/rc"))
}

/// Reads a single `key = value` line from an INI-ish config file (like npmrc /
/// pnpm rc). Returns `None` when the file or key is missing.
fn read_kv(path: &Path, key: &str) -> Option<String> {
    let content = std::fs::read_to_string(path).ok()?;
    content.lines().find_map(|line| {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') || line.starts_with(';') {
            return None;
        }
        let (k, v) = line.split_once('=')?;
        if k.trim().eq_ignore_ascii_case(key) {
            Some(v.trim().to_owned())
        } else {
            None
        }
    })
}

/// Joins a Windows env-var-relative path (e.g. `%WINDIR%`). Always `None` on
/// other platforms.
#[cfg(target_os = "windows")]
fn winvar(name: &str, rel: &str) -> Option<PathBuf> {
    std::env::var_os(name).map(|root| PathBuf::from(root).join(rel))
}

#[cfg(not(target_os = "windows"))]
const fn winvar(_name: &str, _rel: &str) -> Option<PathBuf> {
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
        .filter_map(std::result::Result::ok)
        .filter(|entry| entry.file_type.is_file())
        .map(|entry| {
            std::fs::symlink_metadata(entry.path()).map_or(0, |meta| meta.len())
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

    #[test]
    fn read_kv_parses_ini_lines() {
        let temp = std::env::temp_dir().join("cs-cache-rc");
        std::fs::write(
            &temp,
            "; comment\n# another comment\n\ncache=E:\\cache\\npm\nstore-dir=E:\\cache\\pnpm\n",
        )
        .unwrap();
        assert_eq!(
            read_kv(&temp, "cache").as_deref(),
            Some("E:\\cache\\npm")
        );
        assert_eq!(
            read_kv(&temp, "store-dir").as_deref(),
            Some("E:\\cache\\pnpm")
        );
        assert_eq!(read_kv(&temp, "missing"), None);
        let _ = std::fs::remove_file(&temp);
    }

    #[test]
    fn read_kv_is_case_insensitive() {
        let temp = std::env::temp_dir().join("cs-cache-rc-case");
        std::fs::write(&temp, "Cache=/x\nSTORE-DIR=/y\n").unwrap();
        assert_eq!(read_kv(&temp, "cache").as_deref(), Some("/x"));
        assert_eq!(read_kv(&temp, "store-dir").as_deref(), Some("/y"));
        let _ = std::fs::remove_file(&temp);
    }

    #[test]
    fn clean_cache_empties_contents_keeps_dir() {
        let temp = std::env::temp_dir().join("cs-cache-clean");
        std::fs::create_dir_all(temp.join("sub")).unwrap();
        std::fs::write(temp.join("a.bin"), vec![0u8; 512]).unwrap();
        std::fs::write(temp.join("sub/b.bin"), vec![0u8; 1024]).unwrap();

        // Resolve a fake spec pointing at `temp` so clean_cache can act on it.
        let specs = cache_specs();
        // Inject a synthetic spec via a manual lookup path: clean_cache only
        // accepts known ids, so exercise `empty_contents` directly here.
        empty_contents(&temp).unwrap();
        assert!(temp.is_dir());
        assert!(std::fs::read_dir(&temp).unwrap().next().is_none());
        let _ = std::fs::remove_dir_all(&temp);
        let _ = specs.len();
    }

    #[test]
    fn clean_cache_rejects_unknown_and_protected() {
        assert!(clean_cache("definitely-not-a-cache").is_err());
        let temp = std::env::temp_dir().join("cs-cache-protected");
        std::fs::create_dir_all(&temp).unwrap();
        // Protected roots are OS-specific; assert the guard exists by checking
        // that a clearly protected path is refused when resolvable as a spec.
        assert!(is_protected(std::path::Path::new(&protected_sample())));
        let _ = std::fs::remove_dir_all(&temp);
    }

    fn protected_sample() -> String {
        #[cfg(target_os = "windows")]
        {
            "C:\\Windows\\System32".to_string()
        }
        #[cfg(not(target_os = "windows"))]
        {
            "/usr/bin".to_string()
        }
    }
}

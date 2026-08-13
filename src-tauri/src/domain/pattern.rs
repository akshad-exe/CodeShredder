//! Known developer-junk folder patterns.

/// Default folder names the scanner hunts for, per the MVP v0.2 roadmap.
pub const DEFAULT_PATTERNS: &[&str] = &[
    "node_modules",
    ".next",
    ".nuxt",
    "dist",
    "build",
    "target",
    "__pycache__",
    ".pytest_cache",
    ".parcel-cache",
    ".turbo",
];

/// Extended patterns including package manager caches and less-common
/// framework/build outputs (can be enabled in settings).
pub const EXTENDED_PATTERNS: &[&str] = &[
    // Package manager caches
    ".npm",
    ".pnpm-store",
    ".yarn",
    ".bun",
    ".cargo",
    ".gradle",
    "Pods",
    ".venv",
    "venv",
    // JS/TS frameworks
    ".svelte-kit",
    ".output",
    ".astro",
    ".docusaurus",
    // Python ecosystem
    ".mypy_cache",
    ".ruff_cache",
    ".tox",
    // Mobile & native
    "DerivedData",
    ".expo",
    ".dart_tool",
    // Generic build outputs, bundlers & linters
    "out",
    ".cache",
    ".eslintcache",
    // Zig
    "zig-out",
    ".zig-cache",
    // C/C++ & .NET
    "CMakeFiles",
    "cmake-build-debug",
    "cmake-build-release",
    ".obj",
    // Gatsby
    ".gatsby",
];

/// All known patterns combined.
pub const ALL_PATTERNS: &[&str] = &[
    "node_modules",
    ".next",
    ".nuxt",
    "dist",
    "build",
    "target",
    "__pycache__",
    ".pytest_cache",
    ".parcel-cache",
    ".turbo",
    ".npm",
    ".pnpm-store",
    ".yarn",
    ".bun",
    ".cargo",
    ".gradle",
    "Pods",
    ".venv",
    "venv",
    ".svelte-kit",
    ".output",
    ".astro",
    ".docusaurus",
    ".mypy_cache",
    ".ruff_cache",
    ".tox",
    "DerivedData",
    ".expo",
    ".dart_tool",
    "out",
    ".cache",
    ".eslintcache",
    "zig-out",
    ".zig-cache",
    "CMakeFiles",
    "cmake-build-debug",
    "cmake-build-release",
    ".obj",
    ".gatsby",
];

/// Maps a matched folder name to an ecosystem group key used for badges,
/// colours and legends in the frontend.
///
/// Groups keep the UI compact: rather than a colour per tool, every target
/// buckets into one of Web / Python / Systems / Mobile / Package caches.
pub fn category_for(folder_name: &str) -> &str {
    match folder_name {
        // Web & JavaScript ecosystem
        "node_modules" | ".next" | ".nuxt" | ".turbo" | ".output" | ".svelte-kit" | ".astro"
        | ".docusaurus" | ".parcel-cache" | ".gatsby" | "dist" | "build" | "out" | ".cache"
        | ".eslintcache" => "web",
        // Python ecosystem
        "__pycache__" | ".pytest_cache" | ".mypy_cache" | ".ruff_cache" | ".tox" => "python",
        // Systems & compiled languages (Rust, Zig, C++, .NET)
        "target"
        | ".zig-cache"
        | "zig-out"
        | "CMakeFiles"
        | "cmake-build-debug"
        | "cmake-build-release"
        | ".obj" => "systems",
        // Mobile & native (iOS / Android)
        "DerivedData" | ".gradle" | ".dart_tool" | "Pods" | ".expo" => "mobile",
        // Package manager caches (npm, yarn, pnpm, bun, cargo, composer)
        ".npm" | ".pnpm-store" | ".yarn" | ".bun" | ".cargo"  => "package_caches",
        other if is_venv_name(other) => "python",
        other => other,
    }
}

/// Detects virtual-environment style folder names regardless of the tool or
/// Python version that created them: `.venv`, `venv`, `env`, `.venv-wsl`,
/// `.py39`, `.py310`, `virtualenv`, etc.
pub fn is_venv_name(name: &str) -> bool {
    matches!(
        name,
        ".venv" | "venv" | ".venv-wsl" | ".venvs" | ".virtualenv" | "virtualenv"
    ) || (name.starts_with(".py") && name[3..].bytes().all(|b| b.is_ascii_digit()))
}

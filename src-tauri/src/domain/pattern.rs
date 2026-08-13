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

/// Extended patterns including package manager caches (can be enabled in settings).
pub const EXTENDED_PATTERNS: &[&str] = &[
    // Package manager caches
    ".npm",
    ".pnpm-store",
    ".yarn",
    ".bun",
    ".cargo",
    ".gradle",
    "Pods",
    "vendor",
    ".venv",
    "venv",
    "env",
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
    "vendor",
    ".venv",
    "venv",
    "env",
];

/// Maps a matched folder name to a stable category key used for badges,
/// colours and legends in the frontend.
pub fn category_for(folder_name: &str) -> &str {
    match folder_name {
        "node_modules" => "node_modules",
        ".next" => "next",
        ".nuxt" => "nuxt",
        "dist" => "dist",
        "build" => "build",
        "target" => "target",
        "__pycache__" => "python",
        ".pytest_cache" => "pytest",
        ".parcel-cache" => "parcel",
        ".turbo" => "turbo",
        ".npm" => "npm_cache",
        ".pnpm-store" => "pnpm_cache",
        ".yarn" => "yarn_cache",
        ".bun" => "bun_cache",
        ".cargo" => "cargo_cache",
        ".gradle" => "gradle_cache",
        "Pods" => "pods",
        "vendor" => "vendor",
        other if is_venv_name(other) => "venv",
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

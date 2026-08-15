//! Single source of truth for scan-pattern metadata on the frontend.
//!
//! Mirrors `domain/pattern.rs` on the backend (which remains authoritative for
//! scanning). Keep the two in sync; only this file should define pattern names,
//! labels and colors in the frontend.

/** Default folder names the scanner hunts for, per the MVP v0.2 roadmap. */
export const DEFAULT_PATTERNS: readonly string[] = [
  'node_modules',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'target',
  '__pycache__',
  '.pytest_cache',
  '.parcel-cache',
  '.turbo',
]

/** Extended patterns including package manager caches and less-common
 * framework/build outputs (can be enabled in settings). */
export const EXTENDED_PATTERNS: readonly string[] = [
  '.npm',
  '.pnpm-store',
  '.yarn',
  '.bun',
  '.cargo',
  '.gradle',
  'Pods',
  '.venv',
  'venv',
  '.svelte-kit',
  '.output',
  '.astro',
  '.docusaurus',
  '.mypy_cache',
  '.ruff_cache',
  '.tox',
  'DerivedData',
  '.expo',
  '.dart_tool',
  'out',
  '.cache',
  '.eslintcache',
  'zig-out',
  '.zig-cache',
  'CMakeFiles',
  'cmake-build-debug',
  'cmake-build-release',
  '.obj',
  '.gatsby',
]

/** All known patterns combined. */
export const ALL_PATTERNS: readonly string[] = [
  ...DEFAULT_PATTERNS,
  ...EXTENDED_PATTERNS,
]

/** Maps each pattern to its ecosystem group key. Mirrors backend `category_for`. */
export const PATTERN_CATEGORIES: Record<string, string> = {
  // Web & JavaScript
  node_modules: 'web',
  '.next': 'web',
  '.nuxt': 'web',
  '.turbo': 'web',
  '.output': 'web',
  '.svelte-kit': 'web',
  '.astro': 'web',
  '.docusaurus': 'web',
  '.parcel-cache': 'web',
  '.gatsby': 'web',
  dist: 'web',
  build: 'web',
  out: 'web',
  '.cache': 'web',
  '.eslintcache': 'web',
  // Python
  '__pycache__': 'python',
  '.pytest_cache': 'python',
  '.mypy_cache': 'python',
  '.ruff_cache': 'python',
  '.tox': 'python',
  '.venv': 'python',
  venv: 'python',
  // Systems
  target: 'systems',
  '.zig-cache': 'systems',
  'zig-out': 'systems',
  CMakeFiles: 'systems',
  'cmake-build-debug': 'systems',
  'cmake-build-release': 'systems',
  '.obj': 'systems',
  // Mobile
  DerivedData: 'mobile',
  '.gradle': 'mobile',
  '.dart_tool': 'mobile',
  Pods: 'mobile',
  '.expo': 'mobile',
  // Package caches
  '.npm': 'package_caches',
  '.pnpm-store': 'package_caches',
  '.yarn': 'package_caches',
  '.bun': 'package_caches',
  '.cargo': 'package_caches',
}

/** Ordered ecosystem groups with their display labels. */
export const CATEGORY_GROUPS: readonly { key: string; label: string }[] = [
  { key: 'web', label: 'Web' },
  { key: 'python', label: 'Python' },
  { key: 'systems', label: 'Systems' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'package_caches', label: 'Package caches' },
]

/** Patterns belonging to a given category key, in display order. */
export function patternsForCategory(category: string): string[] {
  return ALL_PATTERNS.filter((p) => PATTERN_CATEGORIES[p] === category)
}

/** Short human-readable label for pills. */
export const PATTERN_LABELS: Record<string, string> = {
  node_modules: 'Node',
  '.next': 'Next',
  '.nuxt': 'Nuxt',
  dist: 'dist',
  build: 'build',
  target: 'Rust',
  '__pycache__': 'Python',
  '.pytest_cache': 'PyTest',
  '.parcel-cache': 'Parcel',
  '.turbo': 'Turbo',
  '.npm': 'npm cache',
  '.pnpm-store': 'pnpm store',
  '.yarn': 'Yarn',
  '.bun': 'Bun',
  '.cargo': 'Cargo',
  '.gradle': 'Gradle',
  Pods: 'CocoaPods',
  '.venv': '.venv',
  venv: 'venv (bare)',
  '.svelte-kit': 'SvelteKit',
  '.output': 'Nitro',
  '.astro': 'Astro',
  '.docusaurus': 'Docusaurus',
  '.mypy_cache': 'Mypy',
  '.ruff_cache': 'Ruff',
  '.tox': 'Tox',
  DerivedData: 'Xcode',
  '.expo': 'Expo',
  '.dart_tool': 'Flutter',
  out: 'out',
  '.cache': 'cache',
  '.eslintcache': 'ESLint',
  'zig-out': 'Zig',
  '.zig-cache': 'Zig',
  CMakeFiles: 'CMake',
  'cmake-build-debug': 'CLion (debug)',
  'cmake-build-release': 'CLion (release)',
  '.obj': 'obj',
  '.gatsby': 'Gatsby',
}

/** Bar/legend color per ecosystem group (falls back to `bg-accent`). */
export const PATTERN_COLORS: Record<string, string> = {
  web: 'bg-accent',
  python: 'bg-[#eab308]',
  systems: 'bg-[#22d3ee]',
  mobile: 'bg-[#f472b6]',
  package_caches: 'bg-[#a78bfa]',
}

/** The default selection of enabled patterns shown on first run. */
export const DEFAULT_ENABLED_PATTERNS: readonly string[] = [
  ...DEFAULT_PATTERNS,
]

/** Turns a category key into a readable label, e.g. `npm_cache` → `npm cache`. */
export function categoryLabel(category: string): string {
  return category.replaceAll('_', ' ')
}


//! Platform-specific capabilities and OS-aware path resolution.
//!
//! **Rule:** every `#[cfg(target_os = ...)]` branch in the crate lives here,
//! matching the `windows` / `macos` / `linux` (and other Unix) targets. Each
//! submodule exposes a universal, cross-platform API; the per-OS differences
//! are hidden behind it so the rest of the codebase stays portable.
//!
//! - [`dirs`]: well-known user directories (home, `LOCALAPPDATA`, `%WINDIR%`).
//! - [`protected`]: filesystem roots that must never be trashed.
//! - [`trash`]: mapping trash item ids to their on-disk payload paths.
//! - [`wsl`]: Windows Subsystem for Linux integration (stubbed elsewhere).

pub mod dirs;
pub mod protected;
pub mod trash;
pub mod wsl;

//! WSL (Windows Subsystem for Linux) models shared with the frontend.

use serde::{Deserialize, Serialize};

/// Whether a WSL distro is currently running.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum WslState {
    Running,
    Stopped,
}

/// A single WSL distro with its disk details.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WslDistro {
    pub name: String,
    pub state: WslState,
    /// Absolute path of the distro's virtual disk (`ext4.vhdx`), if found.
    pub vhdx_path: Option<String>,
    /// Current on-disk size of the virtual disk file in bytes.
    pub size_bytes: Option<u64>,
}

/// Result of compacting a distro's virtual disk.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WslCompactResult {
    pub distro: String,
    pub before_bytes: Option<u64>,
    pub after_bytes: Option<u64>,
    pub freed_bytes: Option<u64>,
    pub error: Option<String>,
}

/// Result of running a cleanup command inside a distro.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WslCleanupResult {
    pub distro: String,
    pub success: bool,
    /// Trimmed combined stdout/stderr of the command.
    pub output: String,
}

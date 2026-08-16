//! Global package-manager caches discovered on the user's machine.

use serde::{Deserialize, Serialize};

/// How risky it is to delete a cache. Lockfile-rebuildable caches (npm, pip,
/// composer, ...) are safe; heavier toolchains (cargo, maven, go, ...) are
/// medium because rebuilding them is slow and offline builds break.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CacheSafety {
    Safe,
    Medium,
    Dangerous,
}

impl CacheSafety {
    pub fn as_str(self) -> &'static str {
        match self {
            CacheSafety::Safe => "safe",
            CacheSafety::Medium => "medium",
            CacheSafety::Dangerous => "dangerous",
        }
    }
}

/// A discovered global cache location with its current size.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CacheEntry {
    pub id: String,
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    /// Ecosystem, e.g. "Node.js", "Rust" — drives frontend grouping.
    pub category: String,
    pub safety: String,
}

/// Outcome of cleaning a single cache, reported to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CacheCleanResult {
    pub id: String,
    pub path: String,
    /// Bytes freed by the cleanup, when it succeeded.
    pub freed_bytes: u64,
    pub error: Option<String>,
}

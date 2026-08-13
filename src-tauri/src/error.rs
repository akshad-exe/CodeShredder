//! Shared error type for the CodeShredder backend.

use thiserror::Error;

/// Application-wide error type. Converted to a frontend-friendly string
/// at the command boundary.
#[derive(Debug, Error)]
pub enum Error {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("System time error: {0}")]
    SystemTime(#[from] std::time::SystemTimeError),

    #[error("Tauri error: {0}")]
    Tauri(#[from] tauri::Error),

    #[error("{0}")]
    Anyhow(#[from] anyhow::Error),

    #[error("{0}")]
    Message(String),
}

/// Convenience alias used across backend modules.
pub type Result<T> = std::result::Result<T, Error>;

impl Error {
    /// Build an [`Error`] from a plain message.
    pub fn msg(message: impl Into<String>) -> Self {
        Self::Message(message.into())
    }
}

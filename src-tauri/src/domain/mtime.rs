//! RFC 3339 timestamp helpers shared by the scanner and the persistent cache.

use std::time::SystemTime;

/// Formats a timestamp for display and for cache comparison. Nanos precision:
/// the size cache compares stored `dir_mtime` / `measured_at` strings against
/// freshly formatted ones, so both sides must agree exactly or the cache would
/// never hit.
pub(crate) fn format_time(time: SystemTime) -> String {
    let dt: chrono::DateTime<chrono::Local> = time.into();
    dt.to_rfc3339_opts(chrono::SecondsFormat::Nanos, true)
}

/// Parses an RFC 3339 timestamp, or `None` when it is unparsable (a corrupt
/// clock or an opaque legacy string).
pub(crate) fn parse_time(value: &str) -> Option<SystemTime> {
    chrono::DateTime::parse_from_rfc3339(value)
        .ok()
        .map(|dt| dt.to_utc().into())
}
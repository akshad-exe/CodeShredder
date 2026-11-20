const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  )
  const value = bytes / 1024 ** i
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2
  return `${value.toFixed(digits)} ${BYTE_UNITS[i]}`
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

/** Human-friendly relative timestamp, e.g. "just now", "5 hours ago",
 * "3 days ago". Falls back to the absolute short date when the input is far
 * enough in the past to read cleaner that way. */
export function formatTimeAgo(iso?: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  const deltaMs = Date.now() - date.getTime()
  const seconds = Math.floor(deltaMs / 1000)
  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`

  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

const DAY_MS = 24 * 60 * 60 * 1000

/** True when the timestamp is within the last `days` (default: 7). Used to
 * flag recently-active items as "not safe to delete" (fresh = in use). */
export function isRecent(iso?: string, days = 7): boolean {
  if (!iso) return false
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return false
  const age = Date.now() - date.getTime()
  return age >= 0 && age < days * DAY_MS
}
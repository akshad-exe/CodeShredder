import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import type { CleanupHistoryEntry } from '@/types/cleanup'
import { getCleanupHistory, isTauri } from '@/lib/ipc'
import { formatCount } from '@/lib/format'

const MODE_LABEL: Record<CleanupHistoryEntry['mode'], string> = {
  trash: 'Moved to Trash',
  permanent: 'Permanently deleted',
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

export function RecentCleanups() {
  const [entries, setEntries] = useState<CleanupHistoryEntry[] | null>(null)

  useEffect(() => {
    if (!isTauri()) return
    let cancelled = false
    getCleanupHistory(20)
      .then((history) => {
        if (!cancelled) setEntries(history)
      })
      .catch(() => {
        if (!cancelled) setEntries([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (entries === null) {
    return (
      <div className="card">
        <div className="flex h-5 w-32 animate-pulse rounded bg-panel-2" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-muted">
          No cleanup history yet. Your recent cleanup runs will show up here.
        </p>
      </div>
    )
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold text-text">Recent cleanups</p>
      </div>
      <ul className="divide-y divide-border">
        {entries.map((entry, index) => (
          <li key={`${entry.timestamp}-${index}`} className="py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-text">
                  {formatCount(entry.total)} folder
                  {entry.total === 1 ? '' : 's'} —{' '}
                  <span className="text-muted">{MODE_LABEL[entry.mode]}</span>
                </p>
                {entry.paths.length > 0 && (
                  <p className="mt-0.5 truncate font-mono text-[11px] text-faint">
                    {entry.paths[0]}
                    {entry.paths.length > 1 ? ` +${entry.paths.length - 1} more` : ''}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted">{formatTime(entry.timestamp)}</p>
                <p
                  className={`mt-0.5 text-[11px] ${entry.failed > 0 ? 'text-danger' : 'text-safe'}`}
                >
                  {entry.failed > 0
                    ? `${entry.failed} failed`
                    : `${entry.affected} cleaned`}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

import { ScanSearch } from 'lucide-react'
import { useCleanupStore } from '@/store/cleanupStore'
import { ResultRow } from './ResultRow'
import { formatCount } from '@/lib/format'

export function ResultsList() {
  const targets = useCleanupStore((s) => s.targets)
  const scanStatus = useCleanupStore((s) => s.scanStatus)
  const currentScanPath = useCleanupStore((s) => s.currentScanPath)
  const scanProgress = useCleanupStore((s) => s.scanProgress)
  const selectedTargets = useCleanupStore((s) => s.selectedTargets)
  const selectAllTargets = useCleanupStore((s) => s.selectAllTargets)
  const deselectAllTargets = useCleanupStore((s) => s.deselectAllTargets)
  const hasProgress = scanStatus !== 'idle'

  const allSelected = targets.length > 0 && selectedTargets.size === targets.length

  if (scanStatus === 'scanning') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-panel px-4 py-4">
          <ScanSearch className="h-5 w-5 animate-pulse text-accent" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="truncate font-mono text-xs text-muted">{currentScanPath}</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
              <div
                className="h-full rounded-full bg-accent transition-all duration-200"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
          <span className="text-xs tabular-nums text-faint">
            {Math.round(scanProgress)}%
          </span>
        </div>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg border border-border bg-panel"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    )
  }

  if (targets.length === 0) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed border-border bg-panel px-4 py-16 text-center">
        <div>
          <ScanSearch className="mx-auto h-10 w-10 text-faint" />
          <p className="mt-4 text-sm font-medium text-text">No junk found yet</p>
          <p className="mt-1 text-xs text-muted">
            {hasProgress
              ? 'Nothing matched your patterns in the scanned folders.'
              : 'Pick folders and hit Scan to detect developer junk.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
          {formatCount(targets.length)} targets
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) =>
              e.target.checked ? selectAllTargets() : deselectAllTargets()
            }
            className="h-3.5 w-3.5 cursor-pointer rounded accent-accent"
          />
          Select all
        </label>
      </div>
      {targets.map((target) => (
        <ResultRow key={target.id} target={target} />
      ))}
    </div>
  )
}
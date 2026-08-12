import { formatBytes, formatCount } from '@/lib/format'
import { useCleanupStore } from '@/store/cleanupStore'

export function ReclaimSummary() {
  const totalReclaimable = useCleanupStore((s) => s.totalReclaimable)
  const targets = useCleanupStore((s) => s.targets)
  const scanRoots = useCleanupStore((s) => s.scanRoots)
  const scanStatus = useCleanupStore((s) => s.scanStatus)

  const showing = scanStatus === 'complete' && targets.length > 0

  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
          Reclaimable
        </p>
        <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight text-text">
          {formatBytes(totalReclaimable)}
        </p>
        <p className="mt-1.5 text-sm text-muted">
          {showing ? (
            <>
              <span className="font-medium text-text">{formatCount(targets.length)}</span>{' '}
              targets across{' '}
              <span className="font-medium text-text">{formatCount(scanRoots.length)}</span>{' '}
              folders
            </>
          ) : (
            'Add folders and scan to find cleanup targets'
          )}
        </p>
      </div>
      <p className="pb-1 text-xs text-faint">
        Tap pills to include or skip a pattern
      </p>
    </div>
  )
}
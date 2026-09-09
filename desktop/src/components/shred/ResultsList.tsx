import { ScanSearch } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useCleanupStore } from '@/store/cleanupStore'
import { ResultRow } from './ResultRow'
import { formatCount } from '@/lib/format'
import { Checkbox } from '@/components/ui/checkbox'

export function ResultsList() {
  const targets = useCleanupStore((s) => s.targets)
  const scanStatus = useCleanupStore((s) => s.scanStatus)
  const currentScanPath = useCleanupStore((s) => s.currentScanPath)
  const scanProgress = useCleanupStore((s) => s.scanProgress)
  const selectedTargets = useCleanupStore((s) => s.selectedTargets)
  const selectAllTargets = useCleanupStore((s) => s.selectAllTargets)
  const deselectAllTargets = useCleanupStore((s) => s.deselectAllTargets)
  const hasProgress = scanStatus !== 'idle'

  // Windowed rendering against the page's own scroll container (`main`), so a
  // home-wide scan with thousands of rows stays a handful of mounted ResultRows
  // instead of mounting every target into the DOM.
  const rowVirtualizer = useVirtualizer({
    count: targets.length,
    getScrollElement: () => document.querySelector('main'),
    estimateSize: () => 100,
    overscan: 10,
    getItemKey: (index) => targets[index].id,
  })

  const allSelected = targets.length > 0 && selectedTargets.size === targets.length
  const liveScanning = scanStatus === 'scanning' && targets.length > 0

  if (scanStatus === 'scanning' && targets.length === 0) {
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
      {liveScanning && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-panel px-4 py-3">
          <ScanSearch className="h-4 w-4 animate-pulse text-accent" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs text-muted">{currentScanPath}</p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-panel-2">
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
      )}
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
          {liveScanning
            ? `Scanning… ${formatCount(targets.length)} targets`
            : `${formatCount(targets.length)} targets`}
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) =>
              checked ? selectAllTargets() : deselectAllTargets()
            }
            className="h-3.5 w-3.5 shrink-0 border-border bg-background"
            aria-label="Select all targets"
          />
          Select all
        </label>
      </div>
      <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={rowVirtualizer.measureElement}
            className="absolute left-0 top-0 w-full pb-2.5"
            style={{ transform: `translateY(${virtualItem.start}px)` }}
          >
            <ResultRow target={targets[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
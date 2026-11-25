import { useMemo } from 'react'
import { formatBytes } from '@/lib/format'
import { PATTERN_COLORS } from '@/lib/patterns'
import { categoryLabel } from '@/lib/patterns'
import { cn } from '@/lib/utils'
import { useCleanupStore } from '@/store/cleanupStore'
import type { CleanupTarget } from '@/types/cleanup'

const POPOVER_ROWS = 5

/** The largest folders of one category, shown while its pill is hovered or focused. */
function CategoryPopover({ targets }: { targets: CleanupTarget[] }) {
  const biggest = [...targets].sort((a, b) => b.sizeBytes - a.sizeBytes)
  const rest = biggest.length - POPOVER_ROWS
  return (
    <div className="invisible absolute left-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-panel-2 p-3 opacity-0 shadow-xl transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
      <ul className="space-y-1.5">
        {biggest.slice(0, POPOVER_ROWS).map((t) => (
          <li key={t.id} className="flex items-baseline justify-between gap-3 text-[11px]">
            <span className="truncate font-mono text-muted" title={t.path}>
              {t.projectName} / {t.folderName}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-text">
              {formatBytes(t.sizeBytes)}
            </span>
          </li>
        ))}
      </ul>
      {rest > 0 && <p className="mt-2 text-[11px] text-faint">+ {rest} more</p>}
    </div>
  )
}

export function SegmentedBar() {
  const targets = useCleanupStore((s) => s.targets)
  const total = useCleanupStore((s) => s.totalReclaimable)

  const groups = useMemo(() => {
    const map = new Map<string, number>()
    targets.forEach((t) => {
      map.set(t.category, (map.get(t.category) ?? 0) + t.sizeBytes)
    })
    return [...map.entries()]
      .map(([category, size]) => ({ category, size }))
      .sort((a, b) => b.size - a.size)
  }, [targets])

  if (targets.length === 0) {
    return (
      <div className="h-2.5 w-full rounded-full bg-panel-2" aria-hidden />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-panel-2">
        {groups.map(({ category, size }) => (
          <div
            key={category}
            className={`h-full ${PATTERN_COLORS[category] ?? 'bg-accent'}`}
            style={{ width: `${(size / total) * 100}%` }}
            title={`${categoryLabel(category)} — ${formatBytes(size)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {groups.map(({ category, size }) => (
          <div key={category} className="group relative">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full border border-border bg-panel px-2.5 py-1 text-[11px] transition-colors hover:border-faint"
            >
              <span
                className={cn('h-2 w-2 rounded-full', PATTERN_COLORS[category] ?? 'bg-accent')}
              />
              <span className="font-mono text-muted">{categoryLabel(category)}</span>
              <span className="text-faint">{formatBytes(size)}</span>
            </button>
            <CategoryPopover targets={targets.filter((t) => t.category === category)} />
          </div>
        ))}
      </div>
    </div>
  )
}
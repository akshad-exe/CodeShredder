import { useMemo } from 'react'
import { formatBytes } from '@/lib/format'
import { PATTERN_COLORS } from '@/data/mock'
import { useCleanupStore } from '@/store/cleanupStore'

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
            title={`${category} — ${formatBytes(size)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {groups.map(({ category, size }) => (
          <div key={category} className="flex items-center gap-1.5 text-xs">
            <span
              className={`h-2 w-2 rounded-sm ${PATTERN_COLORS[category] ?? 'bg-accent'}`}
            />
            <span className="font-mono text-muted">{category}</span>
            <span className="text-faint">{formatBytes(size)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
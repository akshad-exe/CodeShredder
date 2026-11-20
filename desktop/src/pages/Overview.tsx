import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useCleanupStore } from '@/store/cleanupStore'
import { formatBytes, formatCount } from '@/lib/format'
import { categoryLabel, PATTERN_COLORS } from '@/lib/patterns'
import { isTauri, listCaches } from '@/lib/ipc'
import type { PageId } from '@/lib/navigation'
import { RecentCleanups } from '@/components/overview/RecentCleanups'
import { cn } from '@/lib/utils'

/** One number, one action, then quiet supporting detail. */
export function Overview({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const totalReclaimable = useCleanupStore((s) => s.totalReclaimable)
  const targets = useCleanupStore((s) => s.targets)
  const [cacheBytes, setCacheBytes] = useState(0)

  useEffect(() => {
    if (!isTauri()) return
    listCaches()
      .then((c) => setCacheBytes(c.reduce((n, e) => n + e.sizeBytes, 0)))
      .catch(() => {})
  }, [])

  const { byCategory, top, projects } = useMemo(() => {
    const cats = new Map<string, number>()
    const projs = new Set<string>()
    for (const t of targets) {
      cats.set(t.category, (cats.get(t.category) ?? 0) + t.sizeBytes)
      projs.add(t.projectPath)
    }
    return {
      byCategory: [...cats.entries()].sort((a, b) => b[1] - a[1]),
      top: [...targets].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 5),
      projects: projs.size,
    }
  }, [targets])

  const hasResults = targets.length > 0

  return (
    <div className="mx-auto max-w-3xl px-8 py-14">
      <p className="text-xs font-medium text-muted">
        {hasResults ? 'Ready to reclaim' : 'Nothing scanned yet'}
      </p>
      <p className="mt-2 text-6xl font-extrabold tabular-nums tracking-tight text-text">
        {hasResults ? formatBytes(totalReclaimable) : '0 B'}
      </p>
      <p className="mt-3 text-sm text-muted">
        {hasResults
          ? `${formatCount(targets.length)} folders in ${formatCount(projects)} project${projects === 1 ? '' : 's'}. Everything goes to the Trash first.`
          : 'Scan your project folders to see what you can clear.'}
      </p>

      <button
        type="button"
        className="btn-primary mt-7 !px-5 !py-2.5 !text-black"
        onClick={() => onNavigate('shred')}
      >
        {hasResults ? 'Review and shred' : 'Scan folders'}
        <ArrowRight className="h-4 w-4" />
      </button>

      {hasResults && (
        <div className="mt-12">
          <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
            {byCategory.map(([cat, size]) => (
              <span
                key={cat}
                className={cn('h-full', PATTERN_COLORS[cat] ?? 'bg-accent')}
                style={{ width: `${(size / totalReclaimable) * 100}%` }}
              />
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
            {byCategory.map(([cat, size]) => (
              <li key={cat} className="flex items-center gap-1.5">
                <span className={cn('h-1.5 w-1.5 rounded-full', PATTERN_COLORS[cat] ?? 'bg-accent')} />
                <span className="capitalize">{categoryLabel(cat)}</span>
                <span className="tabular-nums text-faint">{formatBytes(size)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {top.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs font-medium text-muted">Biggest</h2>
          <ul className="mt-3 divide-y divide-border/60">
            {top.map((t) => (
              <li key={t.id} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="min-w-0 truncate text-sm text-text">
                  <span className="font-mono">{t.folderName}</span>
                  <span className="ml-2 text-muted">{t.projectName}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted">{formatBytes(t.sizeBytes)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cacheBytes > 0 && (
        <button
          type="button"
          onClick={() => onNavigate('caches')}
          className="mt-8 flex w-full items-center justify-between border-t border-border/60 pt-5 text-left text-sm text-muted transition-colors hover:text-text"
        >
          <span>
            Caches <span className="ml-2 tabular-nums text-faint">{formatBytes(cacheBytes)}</span>
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>
      )}

      <section className="mt-12">
        <h2 className="text-xs font-medium text-muted">Recent</h2>
        <RecentCleanups bare limit={3} />
      </section>
    </div>
  )
}

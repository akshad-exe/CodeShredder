import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, FolderTree, HardDrive, Layers, ScanSearch, Sparkles, Trash2 } from 'lucide-react'
import { useCleanupStore } from '@/store/cleanupStore'
import { formatBytes, formatCount } from '@/lib/format'
import { categoryLabel, PATTERN_COLORS } from '@/lib/patterns'
import { isTauri, listCaches } from '@/lib/ipc'
import { NAV_GROUPS, type PageId } from '@/lib/navigation'
import { RecentCleanups } from '@/components/overview/RecentCleanups'
import { cn } from '@/lib/utils'

const TILES: { id: PageId; blurb: string }[] = [
  { id: 'shred', blurb: 'Find node_modules, build output and virtual envs' },
  { id: 'caches', blurb: 'Package-manager and system caches' },
  { id: 'duplicates', blurb: 'Identical files, matched by content hash' },
  { id: 'videos', blurb: 'The heaviest video files on disk' },
  { id: 'large-files', blurb: 'Biggest files across your folders' },
  { id: 'recycle-bin', blurb: 'Restore or permanently empty removed items' },
  { id: 'wsl', blurb: 'Shrink bloated WSL virtual disks' },
  { id: 'settings', blurb: 'Scan folders, patterns and ignore rules' },
]
const NAV_ITEMS = Object.fromEntries(NAV_GROUPS.flatMap((g) => g.items).map((i) => [i.id, i]))

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Trash2
  label: string
  value: string
  sub: string
  tone: string
}) {
  return (
    <div className="card flex items-start gap-3">
      <div className={cn('grid h-9 w-9 shrink-0 place-content-center rounded-lg', tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">{label}</p>
        <p className="mt-0.5 text-xl font-bold tabular-nums text-text">{value}</p>
        <p className="truncate text-xs text-muted">{sub}</p>
      </div>
    </div>
  )
}

export function Overview({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const totalReclaimable = useCleanupStore((s) => s.totalReclaimable)
  const targets = useCleanupStore((s) => s.targets)
  const scanRoots = useCleanupStore((s) => s.scanRoots)
  const scanStatus = useCleanupStore((s) => s.scanStatus)
  const [cacheBytes, setCacheBytes] = useState<number | null>(null)

  useEffect(() => {
    if (!isTauri()) return
    listCaches()
      .then((c) => setCacheBytes(c.reduce((n, e) => n + e.sizeBytes, 0)))
      .catch(() => setCacheBytes(null))
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

  const scanning = scanStatus === 'scanning'
  const hasResults = targets.length > 0

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-8 py-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Overview</h1>
        <p className="mt-1 text-sm text-muted">Your reclaimable space at a glance.</p>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-panel p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              {hasResults ? 'Ready to reclaim' : 'Get started'}
            </p>
            <p className="mt-3 text-5xl font-extrabold tabular-nums tracking-tight text-text">
              {hasResults ? formatBytes(totalReclaimable) : '—'}
            </p>
            <p className="mt-2 max-w-sm text-sm text-muted">
              {hasResults
                ? `${formatCount(targets.length)} cleanup targets across ${formatCount(projects)} project${projects === 1 ? '' : 's'}. Everything moves to the Trash first.`
                : 'Run a scan to find node_modules, build output, virtual envs and caches you can safely clear.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button type="button" className="btn-primary !text-black" onClick={() => onNavigate('shred')}>
                {hasResults ? 'Review and shred' : 'Scan folders'}
                <ArrowRight className="h-4 w-4" />
              </button>
              {scanning && (
                <span className="inline-flex items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted">
                  <ScanSearch className="h-3.5 w-3.5 animate-pulse text-accent" />
                  Scanning…
                </span>
              )}
            </div>
          </div>

          <div>
            {hasResults ? (
              <>
                <p className="mb-2 text-xs font-semibold text-text">Space by category</p>
                <div className="flex h-3 overflow-hidden rounded-full bg-background">
                  {byCategory.map(([cat, size]) => (
                    <span
                      key={cat}
                      className={cn('h-full', PATTERN_COLORS[cat] ?? 'bg-accent')}
                      style={{ width: `${(size / totalReclaimable) * 100}%` }}
                      title={`${categoryLabel(cat)} · ${formatBytes(size)}`}
                    />
                  ))}
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {byCategory.map(([cat, size]) => (
                    <li key={cat} className="flex items-center gap-2 text-xs">
                      <span className={cn('h-2 w-2 rounded-full', PATTERN_COLORS[cat] ?? 'bg-accent')} />
                      <span className="capitalize text-muted">{categoryLabel(cat)}</span>
                      <span className="ml-auto tabular-nums text-faint">{formatBytes(size)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="grid place-items-center rounded-xl border border-dashed border-border bg-background/40 px-6 py-10 text-center">
                <Layers className="h-8 w-8 text-faint" />
                <p className="mt-3 text-sm font-medium text-text">No scan results yet</p>
                <p className="mt-1 text-xs text-muted">Your space breakdown will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Trash2} label="Targets" value={formatCount(targets.length)} sub={`${formatCount(projects)} projects`} tone="bg-accent/10 text-accent" />
        <Stat
          icon={HardDrive}
          label="Largest"
          value={top[0] ? formatBytes(top[0].sizeBytes) : '—'}
          sub={top[0]?.displayPath ?? 'Scan to discover'}
          tone="bg-warning/10 text-warning"
        />
        <Stat
          icon={Layers}
          label="Caches"
          value={cacheBytes === null ? '—' : formatBytes(cacheBytes)}
          sub="Package and system caches"
          tone="bg-violet-500/10 text-violet-400"
        />
        <Stat icon={FolderTree} label="Scan folders" value={formatCount(scanRoots.length)} sub={scanRoots[0] ?? 'None yet'} tone="bg-safe/10 text-safe" />
      </div>

      {/* Jump in */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-text">Jump in</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {TILES.map(({ id, blurb }) => {
            const item = NAV_ITEMS[id]
            const Icon = item.icon
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className="group card-hover flex items-start gap-3 text-left hover:border-accent/40"
              >
                <span className={cn('grid h-9 w-9 shrink-0 place-content-center rounded-lg', item.tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between text-sm font-semibold text-text">
                    {item.label}
                    <ArrowRight className="h-3.5 w-3.5 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{blurb}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Top targets + history */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-3">
          <p className="text-sm font-semibold text-text">Biggest targets</p>
          {top.length === 0 ? (
            <p className="text-sm text-muted">Scan to see what is taking the most space.</p>
          ) : (
            <ul className="space-y-3">
              {top.map((t) => (
                <li key={t.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm text-text">
                      <span className="font-mono">{t.folderName}</span>
                      <span className="text-muted"> · {t.projectName}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-accent">{formatBytes(t.sizeBytes)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(t.sizeBytes / top[0].sizeBytes) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <RecentCleanups />
      </div>
    </div>
  )
}

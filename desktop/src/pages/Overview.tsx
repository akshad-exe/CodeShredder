import { ArrowRight, Copy, FolderX, HardDrive } from 'lucide-react'
import { useCleanupStore } from '@/store/cleanupStore'
import { formatBytes, formatCount } from '@/lib/format'
import { useScan } from '@/hooks/useScan'
import { RecentCleanups } from '@/components/overview/RecentCleanups'
import { SegmentedBar } from '@/components/shred/SegmentedBar'
import type { PageId } from '@/lib/navigation'

const TOOLS = [
  { page: 'caches', label: 'Caches', hint: 'Package manager caches', icon: FolderX, tone: 'bg-amber-500/10 text-amber-400' },
  { page: 'large-files', label: 'Large Files', hint: 'What takes the most room', icon: HardDrive, tone: 'bg-cyan-500/10 text-cyan-400' },
  { page: 'duplicates', label: 'Duplicates', hint: 'Identical copies', icon: Copy, tone: 'bg-violet-500/10 text-violet-400' },
] as const

export function Overview({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const totalReclaimable = useCleanupStore((s) => s.totalReclaimable)
  const targets = useCleanupStore((s) => s.targets)
  const populateDefaultRoots = useCleanupStore((s) => s.populateDefaultRoots)
  const { scanStatus, start } = useScan()
  const scanning = scanStatus === 'scanning'
  const hasResults = targets.length > 0 || scanning
  const biggest = [...targets].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 5)

  const openShred = () => {
    if (!hasResults) {
      populateDefaultRoots()
      void start()
    }
    onNavigate('shred')
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-8 py-8">
      <h1 className="text-2xl font-bold text-text">Overview</h1>

      <section className="card space-y-5 !p-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
              Reclaimable
            </p>
            <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight text-text">
              {formatBytes(totalReclaimable)}
            </p>
            <p className="mt-1.5 text-sm text-muted">
              {scanning
                ? 'Scanning your folders…'
                : targets.length > 0
                  ? `${formatCount(targets.length)} folders can be cleaned`
                  : 'Scan to find node_modules, build output and caches.'}
            </p>
          </div>
          <button type="button" className="btn-primary shrink-0" onClick={openShred}>
            {hasResults ? 'Review results' : 'Scan now'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {targets.length > 0 && <SegmentedBar />}
      </section>

      <div className="grid grid-cols-3 gap-4">
        {TOOLS.map(({ page, label, hint, icon: Icon, tone }) => (
          <button
            key={page}
            type="button"
            onClick={() => onNavigate(page)}
            className="card flex items-center gap-3 text-left transition-colors hover:border-faint"
          >
            <span className={`grid h-9 w-9 shrink-0 place-content-center rounded-lg ${tone}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-text">{label}</span>
              <span className="block truncate text-xs text-muted">{hint}</span>
            </span>
          </button>
        ))}
      </div>

      {biggest.length > 0 && (
        <section className="card space-y-3">
          <h2 className="text-sm font-semibold text-text">Biggest folders</h2>
          <ul className="space-y-3">
            {biggest.map((t) => (
              <li key={t.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="truncate font-mono text-xs text-muted" title={t.path}>
                    {t.projectName} / {t.folderName}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-text">
                    {formatBytes(t.sizeBytes)}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-panel-2">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(t.sizeBytes / (biggest[0].sizeBytes || 1)) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RecentCleanups />
    </div>
  )
}

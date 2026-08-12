import { ArrowRight, Trash2, HardDrive, FolderTree } from 'lucide-react'
import { useCleanupStore } from '@/store/cleanupStore'
import { formatBytes, formatCount } from '@/lib/format'
import type { PageId } from '@/lib/navigation'

function StatCard({
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
    <div className="card space-y-3">
      <div className={`grid h-9 w-9 place-content-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-text">{value}</p>
        <p className="mt-0.5 text-xs text-muted">{sub}</p>
      </div>
    </div>
  )
}

export function OverviewPage({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const totalReclaimable = useCleanupStore((s) => s.totalReclaimable)
  const targets = useCleanupStore((s) => s.targets)
  const scanRoots = useCleanupStore((s) => s.scanRoots)

  const biggest =
    targets.length > 0
      ? targets.reduce((a, b) => (a.sizeBytes > b.sizeBytes ? a : b))
      : null

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          Your reclaimable space at a glance.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={Trash2}
          label="Reclaimable"
          value={formatBytes(totalReclaimable)}
          sub={`${formatCount(targets.length)} cleanup targets`}
          tone="bg-accent/10 text-accent"
        />
        <StatCard
          icon={HardDrive}
          label="Largest target"
          value={biggest ? formatBytes(biggest.sizeBytes) : '—'}
          sub={biggest ? `${biggest.projectName}/${biggest.folderName}` : 'Scan to discover'}
          tone="bg-warning/10 text-warning"
        />
        <StatCard
          icon={FolderTree}
          label="Scan roots"
          value={formatCount(scanRoots.length)}
          sub={scanRoots[0] ?? 'No folders yet'}
          tone="bg-safe/10 text-safe"
        />
      </div>

      <div className="card flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-text">Ready to reclaim space?</p>
          <p className="mt-1 text-xs text-muted">
            Scan your scanned folders to find developer junk like{' '}
            <span className="font-mono text-faint">node_modules</span>,{' '}
            <span className="font-mono text-faint">.next</span>, and{' '}
            <span className="font-mono text-faint">target</span>.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary shrink-0"
          onClick={() => onNavigate('shred')}
        >
          Open Shred
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
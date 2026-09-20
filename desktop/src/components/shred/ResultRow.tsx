import { FolderOpen, Trash2 } from 'lucide-react'
import type { CleanupTarget, SafetyLevel } from '@/types/cleanup'
import { formatBytes, formatCount, formatDate } from '@/lib/format'
import { categoryLabel } from '@/lib/patterns'
import { useCleanupStore } from '@/store/cleanupStore'
import { cn } from '@/lib/utils'
import { cleanupTargets, isTauri, revealFolder } from '@/lib/ipc'
import { toast } from '@/components/ui/sonner'

const SAFETY_BADGE: Record<SafetyLevel, string> = {
  safe: 'badge-safe',
  medium: 'badge-medium',
  dangerous: 'badge-danger',
}

const SAFETY_LABEL: Record<SafetyLevel, string> = {
  safe: 'Safe',
  medium: 'Rebuildable',
  dangerous: 'Review',
}

export function ResultRow({
  target,
  displayPath,
  className,
}: {
  target: CleanupTarget
  /** Path shown as the row's primary label. Defaults to `target.displayPath`. */
  displayPath?: string
  className?: string
}) {
  const selectedTargets = useCleanupStore((s) => s.selectedTargets)
  const toggleTargetSelection = useCleanupStore((s) => s.toggleTargetSelection)
  const totalReclaimable = useCleanupStore((s) => s.totalReclaimable)

  const selected = selectedTargets.has(target.id)
  const barWidth = Math.min(100, (target.sizeBytes / totalReclaimable) * 100)

  const handleDelete = async () => {
    const store = useCleanupStore.getState()
    const mode = store.settings.deleteMode
    if (!isTauri()) {
      store.setCleanupStatus('complete')
      store.setCleanupSummary({ total: 1, affected: 1, failed: 0, mode, errors: [] })
      store.removeTargets([target.id])
      toast.success(`Moved ${target.folderName} to Trash`)
      return
    }
    store.setCleanupStatus('cleaning')
    store.setCleanupSummary(null)
    try {
      const summary = await cleanupTargets([target.path], mode)
      store.setCleanupStatus(summary.failed > 0 ? 'error' : 'complete')
      store.setCleanupSummary(summary)
      store.removeTargets([target.id])
      if (summary.failed > 0) {
        toast.error(`Couldn't clean ${target.folderName}`, {
          description: summary.errors[0]?.error,
        })
      } else if (mode === 'permanent') {
        toast.success(`Permanently deleted ${target.folderName}`)
      } else {
        toast.success(`Moved ${target.folderName} to Trash`)
      }
    } catch (err) {
      store.setCleanupStatus('error')
      store.setCleanupSummary({
        total: 1,
        affected: 0,
        failed: 1,
        mode,
        errors: [
          { path: target.path, error: err instanceof Error ? err.message : String(err) },
        ],
      })
      toast.error(`Couldn't clean ${target.folderName}`, {
        description: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors duration-150',
        selected
          ? 'border-accent/40 bg-accent/[0.04]'
          : 'border-border bg-panel hover:border-border/70',
        className,
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => toggleTargetSelection(target.id)}
        className="h-4 w-4 shrink-0 accent-[var(--accent)]"
        aria-label={`Select ${target.path}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <span className="truncate font-mono text-sm font-semibold text-text" title={target.path}>
            {displayPath ?? target.displayPath}
          </span>
          <span className="shrink-0 font-mono text-xs text-muted">
            {target.folderName}
          </span>
          <span className={cn('shrink-0', SAFETY_BADGE[target.safetyLevel])}>
            {categoryLabel(target.category).toUpperCase()}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 truncate font-mono text-[11px] leading-tight text-faint">
          <span className="truncate">{target.path}</span>
          <span className="shrink-0">·</span>
          <span className="shrink-0 tabular-nums text-muted">
            {formatCount(target.fileCount)} files
          </span>
          <span className="shrink-0">·</span>
          <span className="shrink-0">{formatDate(target.lastModified)}</span>
        </div>
        <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-panel-2">
          <div
            className="h-full rounded-full bg-accent/60"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      <div className="shrink-0 pl-3 text-right">
        <p className="text-sm font-semibold tabular-nums text-text">
          {formatBytes(target.sizeBytes)}
        </p>
        <p className="text-[11px] text-faint">{SAFETY_LABEL[target.safetyLevel]}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          title={`Move ${target.folderName} to Trash`}
          className="btn-ghost !p-2 text-muted hover:text-danger"
          onClick={() => void handleDelete()}
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          title={`Reveal ${target.path}`}
          className="btn-ghost !p-2 text-muted hover:text-text"
          onClick={() => void revealFolder(target.path)}
        >
          <FolderOpen className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
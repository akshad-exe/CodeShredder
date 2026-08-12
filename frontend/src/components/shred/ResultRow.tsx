import { FolderOpen } from 'lucide-react'
import type { CleanupTarget, SafetyLevel } from '@/types/cleanup'
import { formatBytes, formatCount, formatDate } from '@/lib/format'
import { useCleanupStore } from '@/store/cleanupStore'
import { cn } from '@/lib/utils'

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

export function ResultRow({ target }: { target: CleanupTarget }) {
  const selectedTargets = useCleanupStore((s) => s.selectedTargets)
  const toggleTargetSelection = useCleanupStore((s) => s.toggleTargetSelection)
  const totalReclaimable = useCleanupStore((s) => s.totalReclaimable)

  const selected = selectedTargets.has(target.id)
  const barWidth = Math.min(100, (target.sizeBytes / totalReclaimable) * 100)

  return (
    <div
      className={cn(
        'group flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors duration-150',
        selected
          ? 'border-accent/40 bg-accent/[0.04]'
          : 'border-border bg-panel hover:border-border/70',
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => toggleTargetSelection(target.id)}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-accent"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <span className="truncate text-sm font-semibold text-text">
            {target.projectName}
          </span>
          <span className="shrink-0 font-mono text-xs text-muted">
            {target.folderName}
          </span>
          <span className={cn('shrink-0', SAFETY_BADGE[target.safetyLevel])}>
            {target.category.toUpperCase()}
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

      <button
        type="button"
        title={`Open ${target.path}`}
        className="btn-ghost !p-2 text-muted hover:text-text"
        onClick={() => window.open(`file://${target.path}`)}
      >
        <FolderOpen className="h-4 w-4" />
      </button>
    </div>
  )
}
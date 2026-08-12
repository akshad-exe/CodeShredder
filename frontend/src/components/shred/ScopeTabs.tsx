import { Plus, X } from 'lucide-react'
import { useCleanupStore } from '@/store/cleanupStore'

export function ScopeTabs() {
  const scanRoots = useCleanupStore((s) => s.scanRoots)
  const removeScanRoot = useCleanupStore((s) => s.removeScanRoot)
  const scanStatus = useCleanupStore((s) => s.scanStatus)
  const locked = scanStatus === 'scanning'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {scanRoots.map((root) => (
        <span
          key={root}
          className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-panel px-3 py-1 font-mono text-xs text-muted"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-safe" />
          {root}
          <button
            type="button"
            aria-label={`Remove ${root}`}
            disabled={locked}
            onClick={() => removeScanRoot(root)}
            className="ml-0.5 text-faint transition-colors hover:text-danger"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        disabled
        title="Folder picking arrives with the real scanner (v0.2)"
        className="btn-secondary !px-3 !py-1 !text-xs"
      >
        <Plus className="h-3 w-3" />
        Add folder
      </button>
    </div>
  )
}
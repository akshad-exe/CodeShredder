import { RefreshCw, ScanSearch, X } from 'lucide-react'
import { useCleanupStore } from '@/store/cleanupStore'

export function ShredHeader({
  onScan,
  onStop,
}: {
  onScan: () => void
  onStop: () => void
}) {
  const scanStatus = useCleanupStore((s) => s.scanStatus)
  const scanning = scanStatus === 'scanning'

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-text">Shred</h1>
        <p className="mt-1 text-sm text-muted">
          Find heavy developer folders and reclaim space safely. Nothing is
          deleted — everything moves to Trash.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {scanning && (
          <button
            type="button"
            onClick={onStop}
            title="Stop scanning"
            aria-label="Stop scanning"
            className="btn-secondary !h-10 !w-10 !p-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          disabled={scanning}
          onClick={onScan}
          className="btn-primary shrink-0"
        >
          {scanning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <ScanSearch className="h-4 w-4" />
          )}
          {scanning ? 'Scanning…' : 'Scan folders'}
        </button>
      </div>
    </div>
  )
}
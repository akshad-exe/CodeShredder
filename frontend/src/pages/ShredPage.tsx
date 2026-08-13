import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { useCleanupStore } from '@/store/cleanupStore'
import { ShredHeader } from '@/components/shred/ShredHeader'
import { ScopeTabs } from '@/components/shred/ScopeTabs'
import { PatternPills } from '@/components/shred/PatternPills'
import { ReclaimSummary } from '@/components/shred/ReclaimSummary'
import { SegmentedBar } from '@/components/shred/SegmentedBar'
import { ResultsList } from '@/components/shred/ResultsList'
import { ConfirmCleanupDialog } from '@/components/shred/ConfirmCleanupDialog'
import { isTauri, scanDevFolders, cleanupTargets, onScanTarget, onScanComplete } from '@/lib/tauri'
import { formatBytes, formatCount } from '@/lib/format'

async function runRealScan() {
  const store = useCleanupStore.getState()
  store.setScanStatus('scanning')
  store.setScanProgress(0)
  store.setCurrentScanPath('Preparing scan…')
  store.setTargets([])
  store.setSelectedTargets(new Set())
  store.setTotalReclaimable(0)
  store.setScanError(null)

  try {
    console.log('[ShredPage] Starting real scan with roots:', store.scanRoots, 'patterns:', store.enabledPatterns)
    // The backend emits scan-target events live; this promise resolves with the
    // final result once the walk finishes. We still await it for error handling,
    // but the UI is updated by the event listeners below.
    const result = await scanDevFolders({
      roots: store.scanRoots,
      patterns: store.enabledPatterns,
    })
    console.log('[ShredPage] Scan result:', result)
  } catch (err) {
    console.error('[ShredPage] Scan failed:', err)
    store.setScanStatus('error')
    store.setScanProgress(0)
    store.setCurrentScanPath('')
    store.setScanError(err instanceof Error ? err.message : String(err))
  }
}

export function ShredPage() {
  const timerRef = useRef<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const targets = useCleanupStore((s) => s.targets)
  const selectedTargets = useCleanupStore((s) => s.selectedTargets)
  const scanStatus = useCleanupStore((s) => s.scanStatus)
  const scanError = useCleanupStore((s) => s.scanError)
  const populateDefaultRoots = useCleanupStore((s) => s.populateDefaultRoots)

  useEffect(() => {
    populateDefaultRoots()
  }, [populateDefaultRoots])

  // Live scan events: stream targets in as they're measured, and finalize when
  // the scan-complete event arrives with the sorted result.
  useEffect(() => {
    if (!isTauri()) return
    const targetSub = onScanTarget((target) => {
      const store = useCleanupStore.getState()
      store.addLiveTarget(target)
      store.setCurrentScanPath(target.path)
      store.setScanProgress(Math.min(95, store.scanProgress + 0.05))
    })
    const completeSub = onScanComplete((result) => {
      const store = useCleanupStore.getState()
      store.setScanStatus('complete')
      store.setScanProgress(100)
      store.setCurrentScanPath('')
      store.setTargets(result.targets)
      store.setTotalReclaimable(result.totalSize)
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    })

    return () => {
      void targetSub.then((fn) => fn())
      void completeSub.then((fn) => fn())
    }
  }, [])

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    },
    [],
  )

  const handleScan = () => {
    if (scanStatus === 'scanning') return
    if (isTauri()) {
      // Indeterminate progress fill while the backend streams targets.
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = window.setInterval(() => {
        const store = useCleanupStore.getState()
        if (store.scanStatus !== 'scanning') return
        store.setScanProgress(Math.min(90, store.scanProgress + Math.random() * 6))
      }, 500)
      void runRealScan()
      return
    }
  }

  const selected = targets.filter((t) => selectedTargets.has(t.id))
  const selectedSize = selected.reduce((acc, t) => acc + t.sizeBytes, 0)
  const nothingSelected = selected.length === 0

  const handleConfirm = async () => {
    const store = useCleanupStore.getState()
    const selected = store.targets.filter((t) => store.selectedTargets.has(t.id))
    if (selected.length === 0) return

    if (!isTauri()) {
      console.log('[ShredPage] mock cleanup of', selected.length, 'targets')
      store.setCleanupStatus('complete')
      store.setCleanupSummary({ total: selected.length, trashed: selected.length, failed: 0, errors: [] })
      store.removeTrashedTargets()
      toast.success(`Moved ${selected.length} folders to Trash`)
      return
    }

    store.setCleanupStatus('cleaning')
    store.setCleanupSummary(null)
    try {
      const summary = await cleanupTargets(selected.map((t) => t.path))
      console.log('[ShredPage] Cleanup result:', summary)
      store.setCleanupStatus(summary.failed > 0 ? 'error' : 'complete')
      store.setCleanupSummary(summary)
      store.removeTrashedTargets()
      if (summary.failed > 0) {
        toast.error(
          `Moved ${summary.trashed} of ${summary.total} folders to Trash`,
          { description: summary.errors.map((e) => e.error).join('; ') },
        )
      } else {
        toast.success(`Moved ${summary.trashed} folders to Trash`)
      }
    } catch (err) {
      store.setCleanupStatus('error')
      store.setCleanupSummary({
        total: selected.length,
        trashed: 0,
        failed: selected.length,
        errors: selected.map((t) => ({ path: t.path, error: err instanceof Error ? err.message : String(err) })),
      })
      toast.error('Cleanup failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="space-y-6">
        <ShredHeader onScan={handleScan} />

        {scanStatus === 'error' && scanError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-medium text-text">Scan failed</p>
              <p className="mt-0.5 font-mono text-xs text-muted">{scanError}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <ScopeTabs />
          <PatternPills />
        </div>

        <div className="card space-y-4">
          <ReclaimSummary />
          <SegmentedBar />
        </div>

        <ResultsList />

        {!nothingSelected && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-accent/40 bg-panel px-5 py-4">
            <div className="flex items-baseline gap-3">
              <p className="text-sm text-muted">
                <span className="font-semibold text-text">
                  {formatCount(selected.length)}
                </span>{' '}
                selected
              </p>
              <p className="text-lg font-bold tabular-nums text-text">
                {formatBytes(selectedSize)}
              </p>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Move to Trash
            </button>
          </div>
        )}
      </div>

      <ConfirmCleanupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowUp, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { useCleanupStore } from '@/store/cleanupStore'
import { ShredHeader } from '@/components/shred/ShredHeader'
import { ScopeTabs } from '@/components/shred/ScopeTabs'
import { PatternPills } from '@/components/shred/PatternPills'
import { ReclaimSummary } from '@/components/shred/ReclaimSummary'
import { SegmentedBar } from '@/components/shred/SegmentedBar'
import { DeleteModeSelect } from '@/components/shred/DeleteModeSelect'
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
  const [scrolled, setScrolled] = useState(false)

  const targets = useCleanupStore((s) => s.targets)
  const selectedTargets = useCleanupStore((s) => s.selectedTargets)
  const scanStatus = useCleanupStore((s) => s.scanStatus)
  const scanError = useCleanupStore((s) => s.scanError)
  const mode = useCleanupStore((s) => s.settings.deleteMode)
  const populateDefaultRoots = useCleanupStore((s) => s.populateDefaultRoots)

  // Track scrolling on the main content column so the floating action bar and
  // scroll-to-top button only appear when they're actually useful.
  useEffect(() => {
    const scroller = document.querySelector('main')
    if (!scroller) return
    const onScroll = () => setScrolled(scroller.scrollTop > 240)
    scroller.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
    const mode = store.settings.deleteMode

    if (!isTauri()) {
      console.log('[ShredPage] mock cleanup of', selected.length, 'targets in mode', mode)
      store.setCleanupStatus('complete')
      store.setCleanupSummary({
        total: selected.length,
        affected: selected.length,
        failed: 0,
        mode,
        errors: [],
      })
      store.removeTrashedTargets()
      toast.success(`Moved ${selected.length} folders to Trash`)
      return
    }

    store.setCleanupStatus('cleaning')
    store.setCleanupSummary(null)
    try {
      const summary = await cleanupTargets(
        selected.map((t) => t.path),
        mode,
      )
      console.log('[ShredPage] Cleanup result:', summary)
      store.setCleanupStatus(summary.failed > 0 ? 'error' : 'complete')
      store.setCleanupSummary(summary)
      store.removeTrashedTargets()
      if (summary.failed > 0) {
        toast.error(
          `Cleaned ${summary.affected} of ${summary.total} folders`,
          { description: summary.errors.map((e) => e.error).join('; ') },
        )
      } else if (mode === 'permanent') {
        toast.success(`Permanently deleted ${summary.affected} folders`)
      } else {
        toast.success(`Moved ${summary.affected} folders to Trash`)
      }
    } catch (err) {
      store.setCleanupStatus('error')
      store.setCleanupSummary({
        total: selected.length,
        affected: 0,
        failed: selected.length,
        mode,
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

        <div className="card space-y-4">
          <DeleteModeSelect />
        </div>

        <ResultsList />

        {!nothingSelected && (
          <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center justify-between gap-6 rounded-xl border border-accent/40 bg-panel/95 px-5 py-3.5 shadow-xl backdrop-blur">
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
              {mode === 'permanent' ? 'Permanently delete' : 'Move to Trash'}
            </button>
          </div>
        )}

        {scrolled && (
          <button
            type="button"
            title="Scroll to top"
            aria-label="Scroll to top"
            onClick={scrollToTop}
            className="btn-secondary fixed bottom-20 right-6 z-40 !h-10 !w-10 !p-0"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
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
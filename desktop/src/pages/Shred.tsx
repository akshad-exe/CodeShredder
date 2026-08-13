import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowUp, Trash2 } from 'lucide-react'
import { useCleanupStore } from '@/store/cleanupStore'
import { ShredHeader } from '@/components/shred/ShredHeader'
import { ScopeTabs } from '@/components/shred/ScopeTabs'
import { PatternPills } from '@/components/shred/PatternPills'
import { ReclaimSummary } from '@/components/shred/ReclaimSummary'
import { SegmentedBar } from '@/components/shred/SegmentedBar'
import { DeleteModeSelect } from '@/components/shred/DeleteModeSelect'
import { ResultsList } from '@/components/shred/ResultsList'
import { ConfirmCleanupDialog } from '@/components/shred/ConfirmCleanupDialog'
import { useScan } from '@/hooks/useScan'
import { useClean } from '@/hooks/useClean'
import { formatBytes, formatCount } from '@/lib/format'

export function Shred() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const targets = useCleanupStore((s) => s.targets)
  const selectedTargets = useCleanupStore((s) => s.selectedTargets)
  const scanError = useCleanupStore((s) => s.scanError)
  const mode = useCleanupStore((s) => s.settings.deleteMode)
  const confirmDangerous = useCleanupStore((s) => s.settings.confirmDangerous)
  const confirmMedium = useCleanupStore((s) => s.settings.confirmMedium)
  const populateDefaultRoots = useCleanupStore((s) => s.populateDefaultRoots)

  const { scanStatus, start: startScan, stop: stopScan } = useScan()
  const { clean: runCleanup } = useClean()

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

  const selected = targets.filter((t) => selectedTargets.has(t.id))
  const selectedSize = selected.reduce((acc, t) => acc + t.sizeBytes, 0)
  const nothingSelected = selected.length === 0

  // The confirmation dialog is skipped when the safety settings say the
  // selection needs no warning: safe-only targets never confirm, dangerous and
  // medium selections confirm only while their toggle is on. Permanent deletes
  // are irreversible, so they always confirm.
  const handleCleanupClick = () => {
    if (mode === 'permanent') {
      setDialogOpen(true)
      return
    }
    const hasDangerous = selected.some((t) => t.safetyLevel === 'dangerous')
    const hasMedium = selected.some((t) => t.safetyLevel === 'medium')
    const needsConfirm = hasDangerous
      ? confirmDangerous
      : hasMedium
        ? confirmMedium
        : false
    if (needsConfirm) {
      setDialogOpen(true)
    } else {
      void runCleanup()
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <div className="space-y-6">
        <ShredHeader onScan={startScan} onStop={stopScan} />

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
              onClick={handleCleanupClick}
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
        onConfirm={runCleanup}
      />
    </div>
  )
}
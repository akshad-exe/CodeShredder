import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useCleanupStore } from '@/store/cleanupStore'
import { ShredHeader } from '@/components/shred/ShredHeader'
import { ScopeTabs } from '@/components/shred/ScopeTabs'
import { PatternPills } from '@/components/shred/PatternPills'
import { ReclaimSummary } from '@/components/shred/ReclaimSummary'
import { SegmentedBar } from '@/components/shred/SegmentedBar'
import { ResultsList } from '@/components/shred/ResultsList'
import { ConfirmCleanupDialog } from '@/components/shred/ConfirmCleanupDialog'
import { MOCK_TARGETS, MOCK_TOTAL_RECLAIMABLE } from '@/data/mock'
import { formatBytes, formatCount } from '@/lib/format'

const MOCK_PATHS = [
  'Reading directory trees…',
  ...MOCK_TARGETS.slice(0, 8).map((t) => `Matching ${t.folderName} in ${t.path}`),
]

function runMockScan() {
  const store = useCleanupStore.getState()
  store.setScanStatus('scanning')
  store.setScanProgress(0)
  store.setCurrentScanPath(MOCK_PATHS[0])
  store.setTargets([])
  store.setSelectedTargets(new Set())
  store.setTotalReclaimable(0)
  store.setScanError(null)

  let step = 0
  const timer = window.setInterval(() => {
    step += 1
    const progress = step / MOCK_PATHS.length
    if (progress >= 1) {
      window.clearInterval(timer)
      store.setScanProgress(100)
      store.setCurrentScanPath('')
      store.setTargets(MOCK_TARGETS)
      store.setTotalReclaimable(MOCK_TOTAL_RECLAIMABLE)
      store.setScanStatus('complete')
      return
    }
    store.setScanProgress(progress * 100)
    store.setCurrentScanPath(MOCK_PATHS[step])
  }, 140)
  return timer
}

export function ShredPage() {
  const timerRef = useRef<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const targets = useCleanupStore((s) => s.targets)
  const selectedTargets = useCleanupStore((s) => s.selectedTargets)
  const scanStatus = useCleanupStore((s) => s.scanStatus)

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    },
    [],
  )

  const handleScan = () => {
    if (scanStatus === 'scanning') return
    const timer = runMockScan()
    timerRef.current = timer
  }

  const selected = targets.filter((t) => selectedTargets.has(t.id))
  const selectedSize = selected.reduce((acc, t) => acc + t.sizeBytes, 0)
  const nothingSelected = selected.length === 0

  const handleConfirm = () => {
    // TODO(v0.3): invoke Tauri clean command (trash mode).
    // eslint-disable-next-line no-console
    console.log('mock cleanup of', selected.length, 'targets')
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="space-y-6">
        <ShredHeader onScan={handleScan} />

        <div className="space-y-3">
          <ScopeTabs />
          <PatternPills />
        </div>

        <div className="card space-y-4">
          <ReclaimSummary />
          <SegmentedBar />
        </div>

        <ResultsList />

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-panel px-5 py-4">
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
            disabled={nothingSelected}
            className="btn-primary"
            onClick={() => setDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Move to Trash
          </button>
        </div>
      </div>

      <ConfirmCleanupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
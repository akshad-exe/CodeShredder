import { useEffect } from 'react'
import { toast } from '@/components/ui/sonner'
import { useCleanupStore } from '@/store/cleanupStore'
import { cancelScan, isTauri, scanDevFolders } from '@/lib/ipc'
import { onScanComplete, onScanTargets } from '@/lib/events'

// Module scope, not component state: a scan outlives the page that started it.
let timer: number | null = null
let lastActivity = 0
let stallWarned = false

function clearTimer() {
  if (timer) window.clearInterval(timer)
  timer = null
}

/** Streams backend scan events into the store. Mount once, at the app root. */
export function useScanEvents() {
  useEffect(() => {
    if (!isTauri()) return
    const targetSub = onScanTargets((batch) => {
      const store = useCleanupStore.getState()
      lastActivity = Date.now()
      store.addLiveTargets(batch)
      store.setCurrentScanPath(batch[batch.length - 1]?.path ?? '')
      store.setScanProgress(Math.min(95, store.scanProgress + 0.05 * batch.length))
    })
    const completeSub = onScanComplete((result) => {
      const store = useCleanupStore.getState()
      // A cancelled scan still emits scan-complete with whatever was streamed;
      // don't overwrite the idle state set by the stop button.
      if (store.scanStatus === 'idle') return
      lastActivity = Date.now()
      stallWarned = false
      store.setScanStatus('complete')
      store.setScanProgress(100)
      store.setCurrentScanPath('')
      // Targets arrived via `scan-targets` batches in arrival order; finalize
      // by size-sorting the accumulated list in place (no second transfer).
      const targets = [...store.targets].sort((a, b) => b.sizeBytes - a.sizeBytes)
      store.setTargets(targets)
      store.setTotalReclaimable(result.totalSize)
      clearTimer()
    })

    return () => {
      void targetSub.then((fn) => fn())
      void completeSub.then((fn) => fn())
    }
  }, [])
}

async function startScan() {
  const store = useCleanupStore.getState()
  if (store.scanStatus === 'scanning') return
  if (!isTauri()) return

  store.setScanStatus('scanning')
  store.setScanProgress(0)
  store.setCurrentScanPath('Preparing scan…')
  store.setTargets([])
  store.setSelectedTargets(new Set())
  store.setTotalReclaimable(0)
  store.setScanError(null)
  lastActivity = Date.now()
  stallWarned = false

  // Indeterminate progress fill while the backend streams targets, plus a
  // watchdog so the UI can never sit stuck in "scanning" forever: if nothing
  // streams for a long stretch the backend is gone (killed process, lost
  // callback), so bail out to an actionable error state.
  clearTimer()
  timer = window.setInterval(() => {
    const s = useCleanupStore.getState()
    if (s.scanStatus !== 'scanning') return
    const idleMs = Date.now() - lastActivity
    if (idleMs > 120_000) {
      clearTimer()
      s.setScanStatus('error')
      s.setScanProgress(0)
      s.setCurrentScanPath('')
      s.setScanError(
        'The scan stopped responding — the app process may have closed. Cancel and rescan to continue.',
      )
      toast.error('Scan stopped responding')
      return
    }
    if (idleMs > 20_000 && !stallWarned) {
      stallWarned = true
      toast.info('Scan is taking a while on a large folder — it is still working.')
    }
    if (idleMs < 20_000) {
      s.setScanProgress(Math.min(90, s.scanProgress + Math.random() * 6))
    }
  }, 500)

  try {
    await scanDevFolders({
      roots: store.scanRoots,
      patterns: store.enabledPatterns,
      ignore: store.settings.ignoreRules,
    })
  } catch (err) {
    store.setScanStatus('error')
    store.setScanProgress(0)
    store.setCurrentScanPath('')
    store.setScanError(err instanceof Error ? err.message : String(err))
    clearTimer()
  }
}

function stopScan() {
  if (!isTauri()) return
  const store = useCleanupStore.getState()
  void cancelScan()
  store.setScanStatus('idle')
  store.setScanProgress(0)
  store.setCurrentScanPath('')
  stallWarned = false
  clearTimer()
  toast.info('Scan stopped')
}

/** Scan status plus controls; safe to use from any page. */
export function useScan() {
  const scanStatus = useCleanupStore((s) => s.scanStatus)
  return { scanStatus, start: startScan, stop: stopScan }
}

import { useCallback, useEffect, useRef } from 'react'
import { toast } from '@/components/ui/sonner'
import { useCleanupStore } from '@/store/cleanupStore'
import { cancelScan, isTauri, scanDevFolders } from '@/lib/ipc'
import { onScanComplete, onScanTarget } from '@/lib/events'

/** Wraps the scan lifecycle: kickoff, live target streaming, completion and
 * cancellation. Reads roots/patterns from the store and streams results back
 * into it, so the Shred page stays purely presentational. */
export function useScan() {
  const timerRef = useRef<number | null>(null)
  const lastActivityRef = useRef<number>(0)
  const stallWarnedRef = useRef(false)

  const scanStatus = useCleanupStore((s) => s.scanStatus)

  // Live scan events: stream targets in as they're measured, and finalize when
  // the scan-complete event arrives with the sorted result.
  useEffect(() => {
    if (!isTauri()) return
    const targetSub = onScanTarget((target) => {
      const store = useCleanupStore.getState()
      lastActivityRef.current = Date.now()
      store.addLiveTarget(target)
      store.setCurrentScanPath(target.path)
      store.setScanProgress(Math.min(95, store.scanProgress + 0.05))
    })
    const completeSub = onScanComplete((result) => {
      const store = useCleanupStore.getState()
      // A cancelled scan still emits scan-complete with whatever was streamed;
      // don't overwrite the idle state set by the stop button.
      if (store.scanStatus === 'idle') return
      lastActivityRef.current = Date.now()
      stallWarnedRef.current = false
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

  const start = useCallback(async () => {
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
    lastActivityRef.current = Date.now()
    stallWarnedRef.current = false

    // Indeterminate progress fill while the backend streams targets, plus a
    // watchdog so the UI can never sit stuck in "scanning" forever: if nothing
    // streams for a long stretch the backend is gone (killed process, lost
    // callback), so bail out to an actionable error state.
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      const s = useCleanupStore.getState()
      if (s.scanStatus !== 'scanning') return
      const idleMs = Date.now() - lastActivityRef.current
      if (idleMs > 120_000) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
        s.setScanStatus('error')
        s.setScanProgress(0)
        s.setCurrentScanPath('')
        s.setScanError(
          'The scan stopped responding — the app process may have closed. Cancel and rescan to continue.',
        )
        toast.error('Scan stopped responding')
        return
      }
      if (idleMs > 20_000 && !stallWarnedRef.current) {
        stallWarnedRef.current = true
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
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (!isTauri()) return
    const store = useCleanupStore.getState()
    void cancelScan()
    store.setScanStatus('idle')
    store.setScanProgress(0)
    store.setCurrentScanPath('')
    stallWarnedRef.current = false
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    toast.info('Scan stopped')
  }, [])

  return { scanStatus, start, stop }
}
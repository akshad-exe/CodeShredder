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

  const scanStatus = useCleanupStore((s) => s.scanStatus)

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
      // A cancelled scan still emits scan-complete with whatever was streamed;
      // don't overwrite the idle state set by the stop button.
      if (store.scanStatus === 'idle') return
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

    // Indeterminate progress fill while the backend streams targets.
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      const s = useCleanupStore.getState()
      if (s.scanStatus !== 'scanning') return
      s.setScanProgress(Math.min(90, s.scanProgress + Math.random() * 6))
    }, 500)

    try {
      await scanDevFolders({
        roots: store.scanRoots,
        patterns: store.enabledPatterns,
      })
    } catch (err) {
      store.setScanStatus('error')
      store.setScanProgress(0)
      store.setCurrentScanPath('')
      store.setScanError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  const stop = useCallback(() => {
    if (!isTauri()) return
    const store = useCleanupStore.getState()
    void cancelScan()
    store.setScanStatus('idle')
    store.setScanProgress(0)
    store.setCurrentScanPath('')
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    toast.info('Scan stopped')
  }, [])

  return { scanStatus, start, stop }
}
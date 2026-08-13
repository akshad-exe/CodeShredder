import { useCallback } from 'react'
import { toast } from '@/components/ui/sonner'
import { useCleanupStore } from '@/store/cleanupStore'
import { cleanupTargets, isTauri } from '@/lib/ipc'

/** Runs a mode-aware cleanup over the currently selected targets, updates the
 * store and shows a toast with the outcome. */
export function useClean() {
  const clean = useCallback(async () => {
    const store = useCleanupStore.getState()
    const selected = store.targets.filter((t) => store.selectedTargets.has(t.id))
    if (selected.length === 0) return
    const mode = store.settings.deleteMode

    if (!isTauri()) {
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
  }, [])

  return { clean }
}
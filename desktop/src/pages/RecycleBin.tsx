import { useEffect, useState } from 'react'
import { ArchiveRestore, Loader2, Recycle, RotateCcw, Trash2 } from 'lucide-react'
import { emptyTrash, isTauri, listTrash, purgeTrash, restoreTrash } from '@/lib/ipc'
import type { TrashItem } from '@/types/cleanup'
import { formatBytes, formatCount, formatDate } from '@/lib/format'
import { toast } from '@/components/ui/sonner'

export function RecycleBin() {
  const [items, setItems] = useState<TrashItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [emptying, setEmptying] = useState(false)

  const refresh = async () => {
    if (!isTauri()) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setItems(await listTrash())
    } catch (err) {
      console.error('[RecycleBin] list failed:', err)
      toast.error('Could not read the Recycle Bin', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const handleRestore = async (id: string) => {
    setBusyIds((s) => new Set(s).add(id))
    try {
      const res = await restoreTrash([id])
      if (res.failed > 0) {
        toast.error('Restore failed', { description: res.errors[0] })
      } else {
        toast.success('Item restored to its original location')
        setItems((prev) => prev.filter((i) => i.id !== id))
      }
    } catch (err) {
      toast.error('Restore failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusyIds((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
    }
  }

  const handlePurge = async (id: string) => {
    setBusyIds((s) => new Set(s).add(id))
    try {
      const res = await purgeTrash([id])
      if (res.failed > 0) {
        toast.error('Delete failed', { description: res.errors[0] })
      } else {
        toast.success('Item permanently deleted')
        setItems((prev) => prev.filter((i) => i.id !== id))
      }
    } catch (err) {
      toast.error('Delete failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusyIds((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
    }
  }

  const handleEmpty = async () => {
    if (!isTauri()) return
    setEmptying(true)
    try {
      const res = await emptyTrash()
      if (res.failed > 0) {
        toast.error('Empty failed', { description: res.errors[0] })
      } else {
        toast.success(`Emptied ${res.succeeded} items from the Recycle Bin`)
        setItems([])
      }
    } catch (err) {
      toast.error('Empty failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setEmptying(false)
    }
  }

  const totalSize = items.reduce((acc, i) => acc + (i.sizeBytes ?? 0), 0)

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Recycle Bin</h1>
          <p className="mt-1 text-sm text-muted">
            Items moved to Trash by Shred live here until you restore or
            permanently delete them.
          </p>
        </div>
        <button
          type="button"
          disabled={items.length === 0 || emptying}
          className="btn-danger shrink-0"
          onClick={() => void handleEmpty()}
        >
          {emptying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Empty Recycle Bin
        </button>
      </div>

      <div className="mt-6 card">
        <div className="flex items-center gap-2">
          <Recycle className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold text-text">
            {formatCount(items.length)} items
          </p>
          <span className="text-xs text-faint">·</span>
          <span className="text-sm tabular-nums text-muted">{formatBytes(totalSize)}</span>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-border bg-panel"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-border bg-panel px-4 py-16 text-center">
          <div>
            <Recycle className="mx-auto h-10 w-10 text-faint" />
            <p className="mt-4 text-sm font-medium text-text">Recycle Bin is empty</p>
            <p className="mt-1 text-xs text-muted">
              Items you move to Trash from the Shred page will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {items.map((item) => {
            const busy = busyIds.has(item.id)
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-panel px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="truncate text-sm font-semibold text-text">
                      {item.name}
                    </span>
                    {item.entries != null && (
                      <span className="shrink-0 font-mono text-xs text-muted">
                        {formatCount(item.entries)} entries
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 truncate font-mono text-[11px] leading-tight text-faint">
                    <span className="truncate" title={item.originalPath}>
                      {item.originalPath}
                    </span>
                    <span className="shrink-0">·</span>
                    <span className="shrink-0">
                      {formatDate(new Date(item.timeDeleted * 1000).toISOString())}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pl-3 text-right">
                  <p className="text-sm font-semibold tabular-nums text-text">
                    {item.sizeBytes != null ? formatBytes(item.sizeBytes) : '—'}
                  </p>
                  <p className="text-[11px] text-faint">Deleted</p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="Restore to original location"
                    disabled={busy}
                    className="btn-ghost !p-2 text-muted hover:text-safe"
                    onClick={() => void handleRestore(item.id)}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArchiveRestore className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    title="Reveal in folder"
                    disabled={busy}
                    className="btn-ghost !p-2 text-muted hover:text-text"
                    onClick={() => void refresh()}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Permanently delete"
                    disabled={busy}
                    className="btn-ghost !p-2 text-muted hover:text-danger"
                    onClick={() => void handlePurge(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
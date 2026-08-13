import { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, Loader2, RotateCcw, Search, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/explore/EmptyState'
import { SAMPLE_DUPLICATES } from '@/components/explore/sampleData'
import { isTauri, scanDuplicates } from '@/lib/ipc'
import type { DuplicateFile, DuplicateGroup } from '@/types/cleanup'
import { formatBytes, formatCount, formatDate } from '@/lib/format'
import { toast } from '@/components/ui/sonner'

const MIN_SIZES = [
  { label: 'Any size', value: 0 },
  { label: '1 MB+', value: 1024 * 1024 },
  { label: '50 MB+', value: 50 * 1024 * 1024 },
  { label: '500 MB+', value: 500 * 1024 * 1024 },
]

function newestInGroup(group: DuplicateGroup): DuplicateFile | undefined {
  return [...group.files].sort((a, b) =>
    (b.modifiedAt ?? '').localeCompare(a.modifiedAt ?? ''),
  )[0]
}

export function Duplicates() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [minSize, setMinSize] = useState(MIN_SIZES[2].value)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const preview = !isTauri()
  const [usingSample, setUsingSample] = useState(false)
  const sample = usingSample || preview

  const refresh = useCallback(async () => {
    if (preview) {
      setGroups(SAMPLE_DUPLICATES)
      setUsingSample(true)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setGroups(await scanDuplicates({ roots: [] }))
      setUsingSample(false)
    } catch (err) {
      console.error('[Duplicates] scan failed:', err)
      setGroups(SAMPLE_DUPLICATES)
      setUsingSample(true)
    } finally {
      setLoading(false)
    }
  }, [preview])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return groups.filter((g) => {
      if (g.sizeBytes < minSize) return false
      if (!q) return true
      return g.files.some(
        (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q),
      )
    })
  }, [groups, query, minSize])

  const duplicateSpace = groups.reduce((acc, g) => acc + g.sizeBytes * (g.files.length - 1), 0)
  const fileCount = groups.reduce((acc, g) => acc + g.files.length, 0)
  const selectedSize = [...selected].reduce((acc, id) => {
    for (const g of groups) {
      const file = g.files.find((f) => f.id === id)
      if (file) return acc + g.sizeBytes
    }
    return acc
  }, 0)

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleTrash = async (ids: string[]) => {
    if (sample) {
      toast.success(`Freed ${formatBytes(ids.reduce((acc, id) => {
        for (const g of groups) {
          const file = g.files.find((f) => f.id === id)
          if (file) return acc + g.sizeBytes
        }
        return acc
      }, 0))} (sample data)`)
      setGroups((prev) =>
        prev
          .map((g) => ({ ...g, files: g.files.filter((f) => !ids.includes(f.id)) }))
          .filter((g) => g.files.length > 1),
      )
      setSelected(new Set())
      return
    }
    toast.error('Duplicate cleanup ships in v1.0')
  }

  const handleTrashAllButNewest = async (group: DuplicateGroup) => {
    const keep = newestInGroup(group)
    const ids = group.files.filter((f) => f.id !== keep?.id).map((f) => f.id)
    await handleTrash(ids)
  }

  return (
    <div className="w-full px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Duplicates</h1>
          <p className="mt-1 text-sm text-muted">
            Find and remove identical files across your drives.
          </p>
          {sample && (
            <span className="mt-2 inline-block rounded-full border border-border bg-panel px-2.5 py-0.5 text-[11px] text-faint">
              Sample data — {preview ? 'browser preview' : 'backend not connected'}
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={loading}
          className="btn-primary shrink-0"
          onClick={() => void refresh()}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Scan for duplicates
        </button>
      </div>

      {groups.length > 0 && (
        <div className="mt-6 card flex items-center gap-2">
          <Copy className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold text-text">
            {formatCount(groups.length)} duplicate groups · {formatCount(fileCount)} files
          </p>
          <span className="text-xs text-faint">·</span>
          <span className="text-sm tabular-nums text-muted">
            {formatBytes(duplicateSpace)} recoverable
          </span>
        </div>
      )}

      {groups.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by file name or path…"
              className="w-full rounded-lg border border-border bg-panel py-2 pl-9 pr-3 text-sm text-text outline-none transition-colors placeholder:text-faint focus:border-accent"
            />
          </div>
          <select
            value={minSize}
            onChange={(e) => setMinSize(Number(e.target.value))}
            className="rounded-lg border border-border bg-panel px-3 py-2 text-sm text-text outline-none transition-colors focus:border-accent"
          >
            {MIN_SIZES.map((s) => (
              <option key={s.label} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="mt-4 space-y-2.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border bg-panel"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Copy}
            title="No duplicates found"
            description="This page needs the v1.0 duplicate scanner (size + content hash). Once it ships, identical files across your scan roots will be grouped here."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={Search} title="Nothing matches" description="Try a different filter or search term." />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((group) => {
            const keep = newestInGroup(group)
            return (
              <div key={group.id} className="rounded-lg border border-border bg-panel">
                <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Copy className="h-3.5 w-3.5 text-warning" />
                    <p className="text-sm font-semibold text-text">
                      {formatCount(group.files.length)} identical files
                    </p>
                    <span className="text-xs text-faint">·</span>
                    <span className="text-sm tabular-nums text-muted">
                      {formatBytes(group.sizeBytes)} each
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost !px-2.5 !py-1.5 text-xs text-muted hover:text-danger"
                    onClick={() => void handleTrashAllButNewest(group)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Trash all but newest
                  </button>
                </div>
                <div className="divide-y divide-border/60">
                  {group.files.map((file) => {
                    const isSelected = selected.has(file.id)
                    const isNewest = file.id === keep?.id
                    return (
                      <div
                        key={file.id}
                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                          isSelected ? 'bg-accent/5' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(file.id)}
                          className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm text-text">{file.name}</span>
                            {isNewest && (
                              <span className="shrink-0 rounded-full bg-safe/10 px-2 py-0.5 text-[11px] font-medium text-safe">
                                Newest
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate font-mono text-[11px] text-faint" title={file.path}>
                            {file.path}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-faint">
                          {formatDate(file.modifiedAt)}
                        </span>
                        <button
                          type="button"
                          title="Move to Trash"
                          disabled={isNewest}
                          className="btn-ghost !p-2 text-muted hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                          onClick={() => void handleTrash([file.id])}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center justify-between gap-6 rounded-xl border border-accent/40 bg-panel/95 px-5 py-3.5 shadow-xl backdrop-blur">
          <div className="flex items-baseline gap-3">
            <p className="text-sm text-muted">
              <span className="font-semibold text-text">{formatCount(selected.size)}</span>{' '}
              selected
            </p>
            <p className="text-lg font-bold tabular-nums text-text">
              {formatBytes(selectedSize)}
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void handleTrash([...selected])}
          >
            <Trash2 className="h-4 w-4" />
            Move to Trash
          </button>
        </div>
      )}
    </div>
  )
}

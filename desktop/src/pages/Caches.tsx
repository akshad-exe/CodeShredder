import { useCallback, useEffect, useMemo, useState } from 'react'
import { FolderOpen, FolderX, Loader2, RotateCcw, Search, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/explore/EmptyState'
import { SAMPLE_CACHES } from '@/components/explore/sampleData'
import { isTauri, listCaches, revealFolder } from '@/lib/ipc'
import type { CacheEntry } from '@/types/cleanup'
import { formatBytes, formatCount } from '@/lib/format'
import { toast } from '@/components/ui/sonner'

const SAFETY_CLASS: Record<CacheEntry['safety'], string> = {
  safe: 'bg-safe/10 text-safe',
  medium: 'bg-warning/10 text-warning',
  dangerous: 'bg-danger/10 text-danger',
}

export function Caches() {
  const [entries, setEntries] = useState<CacheEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [cleaning, setCleaning] = useState(false)
  const preview = !isTauri()
  const [usingSample, setUsingSample] = useState(false)
  const sample = usingSample || preview

  const refresh = useCallback(async () => {
    if (preview) {
      setEntries(SAMPLE_CACHES)
      setUsingSample(true)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setEntries(await listCaches())
      setUsingSample(false)
    } catch (err) {
      console.error('[Caches] list failed:', err)
      setEntries(SAMPLE_CACHES)
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
    return [...entries]
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.path.toLowerCase().includes(q),
      )
      .sort((a, b) => b.sizeBytes - a.sizeBytes)
  }, [entries, query])

  const totalSize = entries.reduce((acc, c) => acc + c.sizeBytes, 0)
  const selectedSize = [...selected].reduce((acc, id) => {
    const entry = entries.find((c) => c.id === id)
    return acc + (entry?.sizeBytes ?? 0)
  }, 0)

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleReveal = async (path: string) => {
    if (!isTauri()) {
      toast.info('Reveal in folder works in the desktop app')
      return
    }
    try {
      await revealFolder(path)
    } catch (err) {
      toast.error('Could not open folder', {
        description: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const handleClean = async (id: string) => {
    if (sample) {
      toast.success('Sample cache removed')
      setEntries((prev) => prev.filter((c) => c.id !== id))
      return
    }
    setCleaning(true)
    try {
      // Backend command ships in v1.0 — `clean_caches` is not implemented yet.
      toast.error('Cache cleaning ships in v1.0')
    } finally {
      setCleaning(false)
    }
  }

  const handleCleanSelected = async () => {
    if (sample) {
      toast.success(`Freed ${formatBytes(selectedSize)} (sample data)`)
      setEntries((prev) => prev.filter((c) => !selected.has(c.id)))
      setSelected(new Set())
      return
    }
    setCleaning(true)
    try {
      toast.error('Cache cleaning ships in v1.0')
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Caches</h1>
          <p className="mt-1 text-sm text-muted">
            Global Deep Clean — clear system-wide package manager, browser and
            temp caches that can trap hundreds of gigabytes.
          </p>
          {sample && (
            <span className="mt-2 inline-block rounded-full border border-border bg-panel px-2.5 py-0.5 text-[11px] text-faint">
              Sample data — {preview ? 'browser preview' : 'backend not connected'}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={loading}
            className="btn-secondary"
            onClick={() => void refresh()}
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            disabled={entries.length === 0}
            className="btn-primary"
            onClick={() => void handleCleanSelected()}
          >
            {cleaning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FolderX className="h-4 w-4" />
            )}
            Clean caches
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="mt-6 card flex items-center gap-2">
          <FolderX className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold text-text">
            {formatCount(entries.length)} caches
          </p>
          <span className="text-xs text-faint">·</span>
          <span className="text-sm tabular-nums text-muted">{formatBytes(totalSize)}</span>
        </div>
      )}

      {entries.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter caches…"
              className="w-full rounded-lg border border-border bg-panel py-2 pl-9 pr-3 text-sm text-text outline-none transition-colors placeholder:text-faint focus:border-accent"
            />
          </div>
        </div>
      )}

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
      ) : entries.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={FolderX}
            title="No caches found"
            description="Nothing to clean yet — package-manager, browser and system temp caches on your machine will appear here once found."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={Search} title="Nothing matches" description="Try a different search term." />
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {filtered.map((entry) => {
            const isSelected = selected.has(entry.id)
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors ${
                  isSelected ? 'border-accent/50 bg-accent/5' : 'border-border bg-panel'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(entry.id)}
                  className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                  aria-label={`Select ${entry.name}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="truncate text-sm font-semibold text-text">
                      {entry.name}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${SAFETY_CLASS[entry.safety]}`}>
                      {entry.safety}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-faint" title={entry.path}>
                    {entry.path}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-text">
                    {formatBytes(entry.sizeBytes)}
                  </p>
                  <p className="text-[11px] text-faint">{entry.category}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title={`Reveal ${entry.path}`}
                    className="btn-ghost !p-2 text-muted hover:text-text"
                    onClick={() => void handleReveal(entry.path)}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={cleaning}
                    title={`Clean ${entry.name}`}
                    className="btn-ghost !p-2 text-muted hover:text-danger"
                    onClick={() => void handleClean(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
          <button type="button" className="btn-primary" onClick={() => void handleCleanSelected()}>
            <Trash2 className="h-4 w-4" />
            Clean selected
          </button>
        </div>
      )}
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { FolderOpen, HardDrive, Loader2, RotateCcw, Search, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/explore/EmptyState'
import { SAMPLE_LARGE_FILES } from '@/components/explore/sampleData'
import { isTauri, scanLargeFiles } from '@/lib/ipc'
import type { LargeFileEntry } from '@/types/cleanup'
import { formatBytes, formatCount, formatDate } from '@/lib/format'
import { toast } from '@/components/ui/sonner'

const MIN_SIZES = [
  { label: 'Any size', value: 0 },
  { label: '100 MB+', value: 100 * 1024 * 1024 },
  { label: '500 MB+', value: 500 * 1024 * 1024 },
  { label: '1 GB+', value: 1024 * 1024 * 1024 },
]

type SortKey = 'size' | 'name' | 'modified'

export function LargeFiles() {
  const [files, setFiles] = useState<LargeFileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [minSize, setMinSize] = useState(MIN_SIZES[2].value)
  const [sort, setSort] = useState<SortKey>('size')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const preview = !isTauri()
  const [usingSample, setUsingSample] = useState(false)
  const sample = usingSample || preview

  const refresh = useCallback(async () => {
    if (preview) {
      setFiles(SAMPLE_LARGE_FILES)
      setUsingSample(true)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setFiles(await scanLargeFiles({ roots: [] }))
      setUsingSample(false)
    } catch (err) {
      console.error('[LargeFiles] scan failed:', err)
      setFiles(SAMPLE_LARGE_FILES)
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
    const list = files.filter((f) => {
      const aboveMin = f.sizeBytes >= minSize
      const matchesQuery =
        !q || f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
      return aboveMin && matchesQuery
    })
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'modified':
          return (b.modifiedAt ?? '').localeCompare(a.modifiedAt ?? '')
        default:
          return b.sizeBytes - a.sizeBytes
      }
    })
  }, [files, query, minSize, sort])

  const totalSize = files.reduce((acc, f) => acc + f.sizeBytes, 0)
  const selectedSize = [...selected].reduce((acc, id) => {
    const file = files.find((f) => f.id === id)
    return acc + (file?.sizeBytes ?? 0)
  }, 0)

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleTrash = async () => {
    if (sample) {
      toast.success(`Freed ${formatBytes(selectedSize)} (sample data)`)
      setFiles((prev) => prev.filter((f) => !selected.has(f.id)))
      setSelected(new Set())
      return
    }
    toast.error('Large-file cleanup ships in v1.0')
  }

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Large Files</h1>
          <p className="mt-1 text-sm text-muted">
            Find videos, archives, logs and installer dumps eating your disk.
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
          Scan
        </button>
      </div>

      {files.length > 0 && (
        <div className="mt-6 card flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold text-text">
            {formatCount(files.length)} files
          </p>
          <span className="text-xs text-faint">·</span>
          <span className="text-sm tabular-nums text-muted">{formatBytes(totalSize)}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter files…"
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
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-panel px-3 py-2 text-sm text-text outline-none transition-colors focus:border-accent"
          >
            <option value="size">Largest first</option>
            <option value="name">Name</option>
            <option value="modified">Recently modified</option>
          </select>
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
      ) : files.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={HardDrive}
            title="No files scanned"
            description="This page needs the v1.0 large-files backend. Once it ships, pick your scan roots to surface the biggest files on disk."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={Search} title="Nothing matches" description="Try a different filter or search term." />
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {filtered.map((file) => {
            const isSelected = selected.has(file.id)
            return (
              <div
                key={file.id}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  isSelected ? 'border-accent/50 bg-accent/5' : 'border-border bg-panel'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(file.id)}
                  className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                  aria-label={`Select ${file.name}`}
                />
                <span className="w-12 shrink-0 rounded bg-panel-2 px-1.5 py-0.5 text-center font-mono text-[11px] uppercase text-muted">
                  {file.ext}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">{file.name}</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-faint" title={file.path}>
                    {file.path}
                  </p>
                </div>
                <div className="shrink-0 pl-3 text-right">
                  <p className="text-sm font-semibold tabular-nums text-text">
                    {formatBytes(file.sizeBytes)}
                  </p>
                  <p className="text-[11px] text-faint">{formatDate(file.modifiedAt)}</p>
                </div>
                <button
                  type="button"
                  title="Reveal in folder"
                  className="btn-ghost !p-2 text-muted hover:text-text"
                  onClick={() => toast.info('Reveal needs the v1.0 backend')}
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Move to Trash"
                  className="btn-ghost !p-2 text-muted hover:text-danger"
                  onClick={() => {
                    if (sample) void handleTrash()
                    else toast.error('Large-file cleanup ships in v1.0')
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
          <button type="button" className="btn-primary" onClick={() => void handleTrash()}>
            <Trash2 className="h-4 w-4" />
            Move to Trash
          </button>
        </div>
      )}
    </div>
  )
}

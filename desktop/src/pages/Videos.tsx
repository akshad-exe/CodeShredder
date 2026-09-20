import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock, Film, FolderOpen, Loader2, RotateCcw, Search, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/explore/EmptyState'
import { SAMPLE_VIDEOS } from '@/components/explore/sampleData'
import { isTauri, scanVideos } from '@/lib/ipc'
import type { VideoEntry } from '@/types/cleanup'
import { formatBytes, formatCount } from '@/lib/format'
import { toast } from '@/components/ui/sonner'
import { useCleanupStore } from '@/store/cleanupStore'

const MIN_SIZES = [
  { label: 'Any size', value: 0 },
  { label: '100 MB+', value: 100 * 1024 * 1024 },
  { label: '500 MB+', value: 500 * 1024 * 1024 },
  { label: '1 GB+', value: 1024 * 1024 * 1024 },
]

const VIDEO_EXT: Record<string, string> = {
  mkv: 'text-pink-400',
  mp4: 'text-sky-400',
  mov: 'text-emerald-400',
  avi: 'text-amber-400',
  wmv: 'text-violet-400',
}

function formatDuration(totalSec?: number): string {
  if (totalSec == null) return '—'
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export function Videos() {
  const [videos, setVideos] = useState<VideoEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [minSize, setMinSize] = useState(MIN_SIZES[2].value)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const preview = !isTauri()
  const [usingSample, setUsingSample] = useState(false)
  const sample = usingSample || preview
  const scanRoots = useCleanupStore((s) => s.scanRoots)
  const populateDefaultRoots = useCleanupStore((s) => s.populateDefaultRoots)

  useEffect(() => {
    populateDefaultRoots()
  }, [populateDefaultRoots])

  const refresh = useCallback(async () => {
    if (preview) {
      setVideos(SAMPLE_VIDEOS)
      setUsingSample(true)
      setLoading(false)
      return
    }
    if (scanRoots.length === 0) {
      setVideos([])
      setUsingSample(false)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setVideos(await scanVideos({ roots: scanRoots, minSizeBytes: 0 }))
      setUsingSample(false)
    } catch (err) {
      console.error('[Videos] scan failed:', err)
      setVideos(SAMPLE_VIDEOS)
      setUsingSample(true)
    } finally {
      setLoading(false)
    }
  }, [preview, scanRoots])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...videos]
      .filter((v) => {
        const aboveMin = v.sizeBytes >= minSize
        const matchesQuery =
          !q || v.name.toLowerCase().includes(q) || v.path.toLowerCase().includes(q)
        return aboveMin && matchesQuery
      })
      .sort((a, b) => b.sizeBytes - a.sizeBytes)
  }, [videos, query, minSize])

  const totalSize = videos.reduce((acc, v) => acc + v.sizeBytes, 0)
  const selectedSize = [...selected].reduce((acc, id) => {
    const video = videos.find((v) => v.id === id)
    return acc + (video?.sizeBytes ?? 0)
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
      setVideos((prev) => prev.filter((v) => !selected.has(v.id)))
      setSelected(new Set())
      return
    }
    toast.error('Video cleanup ships in v1.0')
  }

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Videos</h1>
          <p className="mt-1 text-sm text-muted">
            Spot large video files eating your disk, sorted by size.
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

      {videos.length > 0 && (
        <div className="mt-6 card flex items-center gap-2">
          <Film className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold text-text">
            {formatCount(videos.length)} videos
          </p>
          <span className="text-xs text-faint">·</span>
          <span className="text-sm tabular-nums text-muted">{formatBytes(totalSize)}</span>
        </div>
      )}

      {videos.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter videos…"
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
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-border bg-panel"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Film}
            title="No videos found"
            description={
              scanRoots.length === 0
                ? 'Add scan roots in Settings, then run a scan to list video files on disk.'
                : 'No video files were found on the scan roots.'
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={Search} title="Nothing matches" description="Try a different filter or search term." />
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {filtered.map((video) => {
            const isSelected = selected.has(video.id)
            return (
              <div
                key={video.id}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  isSelected ? 'border-accent/50 bg-accent/5' : 'border-border bg-panel'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(video.id)}
                  className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                  aria-label={`Select ${video.name}`}
                />
                <span className={`grid h-9 w-9 shrink-0 place-content-center rounded-lg bg-panel-2 ${VIDEO_EXT[video.ext] ?? 'text-muted'}`}>
                  <Film className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-text">{video.name}</p>
                    <span className="shrink-0 font-mono text-[11px] uppercase text-faint">
                      .{video.ext}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-faint" title={video.path}>
                    {video.path}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-[11px] text-faint">
                  <Clock className="h-3 w-3" />
                  {formatDuration(video.durationSec)}
                </div>
                <div className="shrink-0 pl-3 text-right">
                  <p className="text-sm font-semibold tabular-nums text-text">
                    {formatBytes(video.sizeBytes)}
                  </p>
                  <p className="text-[11px] text-faint">size</p>
                </div>
                <button
                  type="button"
                  title="Reveal in folder"
                  className="btn-ghost !p-2 text-muted hover:text-text"
                  onClick={() => toast.info('Reveal in folder is coming soon')}
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Move to Trash"
                  className="btn-ghost !p-2 text-muted hover:text-danger"
                  onClick={() => {
                    if (sample) void handleTrash()
                    else toast.error('Cleaning videos is coming soon')
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

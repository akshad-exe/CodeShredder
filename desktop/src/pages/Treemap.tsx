import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight, Loader2, PieChart, RotateCcw } from 'lucide-react'
import { EmptyState } from '@/components/explore/EmptyState'
import { SAMPLE_TREEMAP } from '@/components/explore/sampleData'
import { useCleanupStore } from '@/store/cleanupStore'
import { isTauri, getTreemap } from '@/lib/ipc'
import type { TreemapNode } from '@/types/cleanup'
import { formatBytes, formatCount } from '@/lib/format'

const DEPTH_COLORS = [
  '#60a5fa',
  '#22d3ee',
  '#a3e635',
  '#fbbf24',
  '#fb7185',
  '#a78bfa',
  '#34d399',
  '#f472b6',
]

function Tile({
  node,
  depth,
  onDrill,
}: {
  node: TreemapNode
  depth: number
  onDrill: (n: TreemapNode) => void
}) {
  const children = node.children ?? []
  const isLeaf = children.length === 0
  const color = `${DEPTH_COLORS[depth % DEPTH_COLORS.length]}cc`

  if (isLeaf) {
    return (
      <div
        className="flex h-full w-full flex-col justify-between overflow-hidden rounded-md p-1.5"
        style={{ backgroundColor: color }}
      >
        <p className="truncate text-[11px] font-medium leading-tight text-black/75">
          {node.name}
        </p>
        <p className="text-[10px] tabular-nums text-black/60">
          {formatBytes(node.sizeBytes)}
        </p>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      title={`${node.name} — ${formatBytes(node.sizeBytes)} (${formatCount(node.fileCount)} files)`}
      onClick={() => onDrill(node)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onDrill(node)
      }}
      className="flex h-full w-full cursor-pointer gap-[3px] rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ flexDirection: depth % 2 === 0 ? 'row' : 'column' }}
    >
      {children.map((child) => (
        <div
          key={child.path}
          className="min-h-0 min-w-0"
          style={{ flexGrow: child.sizeBytes, flexBasis: 0 }}
        >
          <Tile node={child} depth={depth + 1} onDrill={onDrill} />
        </div>
      ))}
    </div>
  )
}

export function Treemap() {
  const scanRoots = useCleanupStore((s) => s.scanRoots)
  const [root, setRoot] = useState<TreemapNode | null>(null)
  const [history, setHistory] = useState<TreemapNode[]>([])
  const [loading, setLoading] = useState(true)
  const preview = !isTauri()
  const [usingSample, setUsingSample] = useState(false)
  const sample = usingSample || preview

  const refresh = useCallback(
    async (target?: string) => {
      if (preview) {
        setRoot(SAMPLE_TREEMAP)
        setHistory([SAMPLE_TREEMAP])
        setUsingSample(true)
        setLoading(false)
        return
      }
      const path = target ?? scanRoots[0]
      if (!path) {
        setRoot(null)
        setUsingSample(true)
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const tree = await getTreemap(path)
        setRoot(tree)
        setHistory([tree])
        setUsingSample(false)
      } catch (err) {
        console.error('[Treemap] scan failed:', err)
        setRoot(SAMPLE_TREEMAP)
        setHistory([SAMPLE_TREEMAP])
        setUsingSample(true)
      } finally {
        setLoading(false)
      }
    },
    [preview, scanRoots],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  const drill = (node: TreemapNode) => {
    setHistory((h) => [...h, node])
    setRoot(node)
  }

  const jumpTo = (index: number) => {
    const target = history[index]
    if (!target) return
    setHistory((h) => h.slice(0, index + 1))
    setRoot(target)
  }

  const topChildren = useMemo(() => {
    if (!root?.children) return []
    const max = Math.max(...root.children.map((c) => c.sizeBytes), 1)
    return [...root.children]
      .sort((a, b) => b.sizeBytes - a.sizeBytes)
      .map((node) => ({ node, pct: (node.sizeBytes / max) * 100 }))
  }, [root])

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Treemap</h1>
          <p className="mt-1 text-sm text-muted">
            Visualize disk usage by folder size and drill into what's eating space.
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
          Scan root
        </button>
      </div>

      {!preview && scanRoots.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <select
            className="rounded-lg border border-border bg-panel px-3 py-2 text-sm text-text outline-none transition-colors focus:border-accent"
            value={history[0]?.path ?? scanRoots[0]}
            onChange={(e) => void refresh(e.target.value)}
          >
            {scanRoots.map((r) => (
              <option key={r} value={r}>
                {r}
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
              className="h-44 animate-pulse rounded-lg border border-border bg-panel"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      ) : !root ? (
        <div className="mt-4">
          <EmptyState
            icon={PieChart}
            title="No treemap yet"
            description="This page needs the v1.0 treemap backend. Once it ships, pick a scan root and a folder-size heatmap will render here."
          />
        </div>
      ) : (
        <>
          {/* Breadcrumb */}
          <nav className="mt-5 flex flex-wrap items-center gap-1 text-sm">
            {history.map((node, i) => {
              const last = i === history.length - 1
              return (
                <span key={node.path} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-faint" />}
                  <button
                    type="button"
                    disabled={last}
                    onClick={() => jumpTo(i)}
                    className={`truncate font-mono text-xs transition-colors ${
                      last ? 'font-semibold text-text' : 'text-muted hover:text-text'
                    }`}
                  >
                    {node.name}
                  </button>
                </span>
              )
            })}
          </nav>

          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_260px]">
            {/* Treemap */}
            <div className="card h-[440px] p-3">
              <div className="flex h-full gap-[3px]">
                {(root.children ?? []).map((child) => (
                  <div
                    key={child.path}
                    className="min-h-0 min-w-0"
                    style={{ flexGrow: child.sizeBytes, flexBasis: 0 }}
                  >
                    <Tile node={child} depth={1} onDrill={drill} />
                  </div>
                ))}
              </div>
            </div>

            {/* Largest folders */}
            <aside className="card space-y-3 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                Largest in {root.name}
              </p>
              <div className="space-y-3">
                {topChildren.map(({ node, pct }) => (
                  <button
                    key={node.path}
                    type="button"
                    onClick={() => drill(node)}
                    className="block w-full text-left"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-xs font-medium text-text">
                        {node.name}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted">
                        {formatBytes(node.sizeBytes)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-panel-2">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: DEPTH_COLORS[0] }}
                      />
                    </div>
                    <p className="mt-0.5 text-[10px] text-faint">
                      {formatCount(node.fileCount)} files ·{' '}
                      {pct.toFixed(0)}% of {root.name}
                    </p>
                  </button>
                ))}
              </div>
            </aside>
          </div>

          <p className="mt-3 text-[11px] text-faint">
            Click any tile to zoom into that folder; click a breadcrumb to go back.
          </p>
        </>
      )}
    </div>
  )
}

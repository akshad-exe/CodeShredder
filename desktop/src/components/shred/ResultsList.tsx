import { useMemo, useState } from 'react'
import { ChevronDown, Clock3, FolderGit2, ScanSearch } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useCleanupStore } from '@/store/cleanupStore'
import { ResultRow } from './ResultRow'
import { formatBytes, formatCount, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CleanupTarget } from '@/types/cleanup'

type ProjectGroup = {
  key: string
  name: string
  sizeBytes: number
  fileCount: number
  lastUsed?: string
  targets: CleanupTarget[]
}

type Row =
  | { kind: 'group'; group: ProjectGroup }
  | { kind: 'target'; target: CleanupTarget; displayPath: string }

/** Groups targets by their owning project (the backend's full project path, so
 * same-named projects under different roots stay separate) and sorts groups by
 * reclaimable size. */
function groupTargets(targets: CleanupTarget[]): ProjectGroup[] {
  const byKey = new Map<string, ProjectGroup>()
  for (const target of targets) {
    const key = target.projectPath || target.projectName || '(unknown)'
    let group = byKey.get(key)
    if (!group) {
      group = {
        key,
        name: target.projectName || '(unknown)',
        sizeBytes: 0,
        fileCount: 0,
        targets: [],
      }
      byKey.set(key, group)
    }
    group.sizeBytes += target.sizeBytes
    group.fileCount += target.fileCount
    // The most recently touched file of any target in this project is the best
    // proxy for "last used or edited" without walking the project itself.
    const ts = target.lastModified ? Date.parse(target.lastModified) : NaN
    if (Number.isFinite(ts) && (!group.lastUsed || ts > Date.parse(group.lastUsed))) {
      group.lastUsed = target.lastModified
    }
    group.targets.push(target)
  }
  return [...byKey.values()].sort((a, b) => b.sizeBytes - a.sizeBytes)
}

/** Path of a target relative to its project root, for display inside the
 * project's block (e.g. `src-tauri\target` instead of repeating the project
 * name once more). Falls back to the backend's own display path. */
function relativePath(target: CleanupTarget): string {
  const root = target.projectPath
  if (root && target.path.startsWith(root)) {
    const rest = target.path.slice(root.length)
    if (rest && rest !== '') {
      return rest.replace(/^[/\\]+/, '') || target.displayPath
    }
  }
  return target.displayPath
}

export function ResultsList() {
  const targets = useCleanupStore((s) => s.targets)
  const scanStatus = useCleanupStore((s) => s.scanStatus)
  const currentScanPath = useCleanupStore((s) => s.currentScanPath)
  const scanProgress = useCleanupStore((s) => s.scanProgress)
  const selectedTargets = useCleanupStore((s) => s.selectedTargets)
  const selectAllTargets = useCleanupStore((s) => s.selectAllTargets)
  const deselectAllTargets = useCleanupStore((s) => s.deselectAllTargets)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const hasProgress = scanStatus !== 'idle'

  const groups = useMemo(() => groupTargets(targets), [targets])

  // Flatten groups into header + target rows so a single virtualizer still
  // backs the whole list. Collapsed groups contribute only their header row.
  const rows = useMemo<Row[]>(() => {
    const flat: Row[] = []
    for (const group of groups) {
      flat.push({ kind: 'group', group })
      if (!collapsed.has(group.key)) {
        for (const target of group.targets) {
          flat.push({ kind: 'target', target, displayPath: relativePath(target) })
        }
      }
    }
    return flat
  }, [groups, collapsed])

  // Layout metadata per row index: whether a visible group follows below (so we
  // know which row ends the block) and which row opens a group.
  const isGroupStart = (index: number) => rows[index].kind === 'group'
  const hasVisibleTargets = (index: number): boolean => {
    const row = rows[index]
    return row.kind === 'group' && rows[index + 1]?.kind === 'target'
  }
  const isLastInBlock = (index: number): boolean => rows[index + 1] === undefined || isGroupStart(index + 1)

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const collapseAll = () => setCollapsed(new Set(groups.map((g) => g.key)))
  const expandAll = () => setCollapsed(new Set())

  // Windowed rendering against the page's own scroll container (`main`), so a
  // home-wide scan with thousands of rows stays a handful of mounted elements
  // instead of mounting every target into the DOM.
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => document.querySelector('main'),
    estimateSize: (index) => (rows[index].kind === 'group' ? 48 : 100),
    overscan: 10,
    getItemKey: (index) => {
      const row = rows[index]
      return row.kind === 'group' ? `g:${row.group.key}` : `t:${row.target.id}`
    },
  })

  const allSelected = targets.length > 0 && selectedTargets.size === targets.length
  const liveScanning = scanStatus === 'scanning' && targets.length > 0

  if (scanStatus === 'scanning' && targets.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-panel px-4 py-4">
          <ScanSearch className="h-5 w-5 animate-pulse text-accent" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="truncate font-mono text-xs text-muted">{currentScanPath}</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
              <div
                className="h-full rounded-full bg-accent transition-all duration-200"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
          <span className="text-xs tabular-nums text-faint">
            {Math.round(scanProgress)}%
          </span>
        </div>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg border border-border bg-panel"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    )
  }

  if (targets.length === 0) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed border-border bg-panel px-4 py-16 text-center">
        <div>
          <ScanSearch className="mx-auto h-10 w-10 text-faint" />
          <p className="mt-4 text-sm font-medium text-text">No junk found yet</p>
          <p className="mt-1 text-xs text-muted">
            {hasProgress
              ? 'Nothing matched your patterns in the scanned folders.'
              : 'Pick folders and hit Scan to detect developer junk.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {liveScanning && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-panel px-4 py-3">
          <ScanSearch className="h-4 w-4 animate-pulse text-accent" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs text-muted">{currentScanPath}</p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-panel-2">
              <div
                className="h-full rounded-full bg-accent transition-all duration-200"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
          <span className="text-xs tabular-nums text-faint">
            {Math.round(scanProgress)}%
          </span>
        </div>
      )}
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
          {liveScanning
            ? `Scanning… ${formatCount(targets.length)} targets`
            : `${formatCount(groups.length)} projects · ${formatCount(targets.length)} targets`}
        </p>
        <div className="flex items-center gap-3">
          {groups.length > 0 && (
            <button
              type="button"
              onClick={collapsed.size === groups.length ? expandAll : collapseAll}
              className="text-[11px] font-medium text-faint transition-colors hover:text-text"
            >
              {collapsed.size === groups.length ? 'Expand all' : 'Collapse all'}
            </button>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => (e.target.checked ? selectAllTargets() : deselectAllTargets())}
              className="h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
              aria-label="Select all targets"
            />
            Select all
          </label>
        </div>
      </div>
      <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const row = rows[virtualItem.index]
          const blockEnd = isLastInBlock(virtualItem.index)
          const rowGap = blockEnd
          const hasChildren = hasVisibleTargets(virtualItem.index)
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              className={cn(
                'absolute left-0 top-0 w-full',
                hasChildren ? 'pb-0' : rowGap ? 'pb-2.5' : 'pb-0',
                row.kind === 'target' && 'pl-8',
              )}
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              {row.kind === 'group' ? (
                <GroupHeader
                  group={row.group}
                  collapsed={collapsed.has(row.group.key)}
                  onToggle={() => toggleGroup(row.group.key)}
                  hasChildren={hasChildren}
                />
              ) : (
                <ResultRow
                  target={row.target}
                  displayPath={row.displayPath}
                  className={cn(
                    'border-l-2 border-l-accent/30 hover:border-l-accent/40',
                    blockEnd
                      ? 'rounded-t-none border-t-0'
                      : 'rounded-none border-t-0 border-b-0',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GroupHeader({
  group,
  collapsed,
  onToggle,
  hasChildren,
}: {
  group: ProjectGroup
  collapsed: boolean
  onToggle: () => void
  hasChildren: boolean
}) {
  const selectedTargets = useCleanupStore((s) => s.selectedTargets)
  const setTargetsSelected = useCleanupStore((s) => s.setTargetsSelected)
  const ids = group.targets.map((t) => t.id)
  const selectedCount = ids.filter((id) => selectedTargets.has(id)).length
  const allSelected = selectedCount === ids.length && ids.length > 0
  const partial = selectedCount > 0 && !allSelected

  return (
    <div
      className={cn(
        'flex items-center gap-3 border border-border bg-panel-2/70 px-4 py-2.5',
        hasChildren ? 'rounded-t-lg' : 'rounded-lg',
      )}
    >
      <input
        type="checkbox"
        checked={allSelected}
        onChange={(e) => setTargetsSelected(ids, e.target.checked)}
        ref={(el) => {
          if (el) el.indeterminate = partial
        }}
        className="h-4 w-4 shrink-0 accent-[var(--accent)]"
        aria-label={`Select all targets in ${group.name}`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        aria-expanded={!collapsed}
      >
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-faint transition-transform duration-150',
            collapsed && '-rotate-90',
          )}
        />
        <FolderGit2 className="h-4 w-4 shrink-0 text-accent" />
        <span className="truncate text-sm font-semibold text-text" title={group.key}>
          {group.name}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-faint">
          {formatCount(group.targets.length)} targets
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-faint">
          · {formatCount(group.fileCount)} files
        </span>
        {group.lastUsed && (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-accent/25 bg-accent/5 px-2 py-0.5 text-[11px] tabular-nums text-accent">
            <Clock3 className="h-3 w-3" />
            {formatDate(group.lastUsed)}
          </span>
        )}
      </button>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-text">
        {formatBytes(group.sizeBytes)}
      </span>
    </div>
  )
}
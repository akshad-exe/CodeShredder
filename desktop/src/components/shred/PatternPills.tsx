import { cn } from '@/lib/utils'
import {
  CATEGORY_GROUPS,
  PATTERN_LABELS,
  PATTERN_COLORS,
  patternsForCategory,
} from '@/lib/patterns'
import { useCleanupStore } from '@/store/cleanupStore'

export function PatternPills() {
  const enabledPatterns = useCleanupStore((s) => s.enabledPatterns)
  const togglePattern = useCleanupStore((s) => s.togglePattern)
  const toggleCategory = useCleanupStore((s) => s.toggleCategory)
  const scanStatus = useCleanupStore((s) => s.scanStatus)
  const locked = scanStatus === 'scanning'

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORY_GROUPS.map(({ key, label }) => {
        const patterns = patternsForCategory(key)
        const enabledInGroup = patterns.filter((p) => enabledPatterns.includes(p)).length
        const allEnabled = enabledInGroup === patterns.length
        const someEnabled = enabledInGroup > 0 && !allEnabled
        const color = PATTERN_COLORS[key] ?? 'bg-accent'

        return (
          <div key={key} className="space-y-1.5">
            <button
              type="button"
              disabled={locked}
              onClick={() => toggleCategory(key)}
              className={cn(
                'group flex w-full items-center gap-2.5 text-left text-sm font-medium transition-colors',
                locked ? 'cursor-default' : 'cursor-pointer',
                allEnabled ? 'text-text' : 'text-muted',
              )}
            >
              <span
                className={cn(
                  'grid h-4 w-4 shrink-0 place-content-center rounded border transition-colors',
                  allEnabled
                    ? 'border-accent bg-accent text-background'
                    : 'border-border bg-panel group-hover:border-accent/50',
                )}
                aria-hidden
              >
                {allEnabled && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                    <path
                      d="M2.5 6.5l2.5 2.5 4.5-5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {someEnabled && (
                  <span className="h-1.5 w-1.5 rounded-sm bg-accent" />
                )}
              </span>
              <span className={cn('h-2 w-2 rounded-sm', color)} aria-hidden />
              <span className="flex-1">{label}</span>
              <span className="text-xs tabular-nums text-faint">
                {enabledInGroup}/{patterns.length}
              </span>
            </button>
            <div className="flex flex-wrap items-center gap-1.5 pl-[22px]">
              {patterns.map((pattern) => (
                <button
                  key={pattern}
                  type="button"
                  disabled={locked}
                  onClick={() => togglePattern(pattern)}
                  className={cn(
                    'rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors duration-150',
                    locked
                      ? 'cursor-default'
                      : 'cursor-pointer hover:border-accent/50',
                    enabledPatterns.includes(pattern)
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-border bg-panel text-faint',
                  )}
                >
                  {PATTERN_LABELS[pattern] ?? pattern}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
import { cn } from '@/lib/utils'
import {
  CATEGORY_GROUPS,
  CATEGORY_TAG_COLORS,
  PATTERN_CATEGORIES,
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORY_GROUPS.map(({ key, label }) => {
        const patterns = patternsForCategory(key)
        const enabledInGroup = patterns.filter((p) => enabledPatterns.includes(p)).length
        const allEnabled = enabledInGroup === patterns.length
        const someEnabled = enabledInGroup > 0 && !allEnabled
        const color = PATTERN_COLORS[key] ?? 'bg-accent'
        const tagColor = CATEGORY_TAG_COLORS[key] ?? 'bg-accent/10 text-accent'

        return (
          <div
            key={key}
            className={cn(
              'rounded-xl border border-border bg-panel p-3 transition-colors duration-150',
              allEnabled
                ? 'border-border hover:border-accent/40'
                : 'border-border/70 hover:border-border',
            )}
          >
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
                    : 'border-border bg-panel-2 group-hover:border-accent/50',
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
              <span className={cn('h-2.5 w-2.5 rounded-full', color)} aria-hidden />
              <span className="flex-1">{label}</span>
              <span className="text-xs tabular-nums text-faint">
                {enabledInGroup}/{patterns.length}
              </span>
            </button>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-[30px]">
              {patterns.map((pattern) => {
                const category = PATTERN_CATEGORIES[pattern]
                const dot = PATTERN_COLORS[category] ?? 'bg-accent'
                return (
                  <button
                    key={pattern}
                    type="button"
                    disabled={locked}
                    onClick={() => togglePattern(pattern)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[10px] transition-colors duration-150',
                      locked
                        ? 'cursor-default'
                        : 'cursor-pointer hover:border-accent/50',
                      enabledPatterns.includes(pattern)
                        ? cn('border-current', tagColor)
                        : 'border-border bg-panel-2 text-faint',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        enabledPatterns.includes(pattern) ? dot : 'border border-border bg-transparent',
                      )}
                      aria-hidden
                    />
                    {PATTERN_LABELS[pattern] ?? pattern}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
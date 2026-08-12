import { cn } from '@/lib/utils'
import { useCleanupStore } from '@/store/cleanupStore'

const PATTERN_LABELS: Record<string, string> = {
  node_modules: 'Node',
  '.next': 'Next',
  '.nuxt': 'Nuxt',
  dist: 'dist',
  build: 'build',
  target: 'Rust',
  '__pycache__': 'Python',
  '.pytest_cache': 'PyTest',
  '.parcel-cache': 'Parcel',
  '.turbo': 'Turbo',
}

export function PatternPills() {
  const enabledPatterns = useCleanupStore((s) => s.enabledPatterns)
  const togglePattern = useCleanupStore((s) => s.togglePattern)
  const scanStatus = useCleanupStore((s) => s.scanStatus)
  const locked = scanStatus === 'scanning'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {enabledPatterns.map((pattern) => (
        <button
          key={pattern}
          type="button"
          disabled={locked}
          onClick={() => togglePattern(pattern)}
          className={cn(
            'rounded-full border px-3 py-1 font-mono text-xs transition-colors duration-150',
            locked
              ? 'cursor-default'
              : 'cursor-pointer hover:border-accent/50',
            enabledPatterns.includes(pattern)
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-border bg-panel text-faint line-through',
          )}
        >
          {PATTERN_LABELS[pattern] ?? pattern}
        </button>
      ))}
    </div>
  )
}
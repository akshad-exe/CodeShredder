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
  '.npm': 'npm cache',
  '.pnpm-store': 'pnpm store',
  '.yarn': 'Yarn',
  '.bun': 'Bun',
  '.cargo': 'Cargo',
  '.gradle': 'Gradle',
  Pods: 'CocoaPods',
  vendor: 'Composer',
  '.venv': 'venv',
  venv: 'venv',
  env: 'venv',
}

const DEFAULT_PATTERNS = [
  'node_modules',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'target',
  '__pycache__',
  '.pytest_cache',
  '.parcel-cache',
  '.turbo',
]

const EXTENDED_PATTERNS = [
  '.npm',
  '.pnpm-store',
  '.yarn',
  '.bun',
  '.cargo',
  '.gradle',
  'Pods',
  'vendor',
  '.venv',
  'venv',
  'env',
]

export function PatternPills() {
  const enabledPatterns = useCleanupStore((s) => s.enabledPatterns)
  const togglePattern = useCleanupStore((s) => s.togglePattern)
  const scanStatus = useCleanupStore((s) => s.scanStatus)
  const locked = scanStatus === 'scanning'

  const isDefault = (p: string) => DEFAULT_PATTERNS.includes(p)
  const isExtended = (p: string) => EXTENDED_PATTERNS.includes(p)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {DEFAULT_PATTERNS.map((pattern) => (
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
      <div className="flex flex-wrap items-center gap-2 text-faint text-xs">
        <span>Extended:</span>
        {EXTENDED_PATTERNS.map((pattern) => (
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
                : 'border-border bg-panel text-faint line-through',
            )}
          >
            {PATTERN_LABELS[pattern] ?? pattern}
          </button>
        ))}
      </div>
    </div>
  )
}
import { Recycle, Zap } from 'lucide-react'
import type { CleanMode } from '@/types/cleanup'
import { useCleanupStore } from '@/store/cleanupStore'

const MODES: { value: CleanMode; label: string; hint: string; icon: typeof Recycle }[] = [
  {
    value: 'trash',
    label: 'Move to Trash',
    hint: 'Recoverable',
    icon: Recycle,
  },
  {
    value: 'permanent',
    label: 'Delete permanently',
    hint: 'Not recoverable',
    icon: Zap,
  },
]

export function DeleteModeSelect() {
  const deleteMode = useCleanupStore((s) => s.settings.deleteMode)
  const setSettings = useCleanupStore((s) => s.setSettings)

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">
        Cleanup mode
      </p>
      <div className="grid grid-cols-2 gap-2">
        {MODES.map(({ value, label, hint, icon: Icon }) => {
          const active = deleteMode === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setSettings({ deleteMode: value })}
              className={`flex flex-col items-start gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-150 ${
                active
                  ? 'border-accent/60 bg-accent/10'
                  : 'border-border bg-panel-2/60 hover:border-border/80'
              }`}
            >
              <span
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  active ? 'text-accent' : 'text-text'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
              <span className="text-[11px] leading-tight text-faint">{hint}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

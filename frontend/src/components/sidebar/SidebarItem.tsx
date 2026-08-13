import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  /** Tailwind classes tinting the icon chip (e.g. `bg-rose-500/10 text-rose-400`). */
  tone: string
  active?: boolean
  onClick: () => void
}

export function SidebarItem({
  icon: Icon,
  label,
  tone,
  active,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150',
        active
          ? 'bg-panel-2 text-text'
          : 'text-muted hover:bg-panel-2 hover:text-text',
      )}
    >
      <span
        className={cn(
          'grid h-7 w-7 shrink-0 place-content-center rounded-md transition-colors duration-150',
          tone,
          active && 'ring-1 ring-inset ring-white/10',
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </button>
  )
}

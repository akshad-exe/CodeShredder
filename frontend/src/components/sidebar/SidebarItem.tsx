import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
}

export function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
        active
          ? 'bg-accent/10 text-accent'
          : 'text-muted hover:bg-panel-2 hover:text-text',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          active ? 'text-accent' : 'text-faint group-hover:text-text',
        )}
      />
      {label}
    </button>
  )
}
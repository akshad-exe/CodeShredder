import { Zap, ShieldCheck } from 'lucide-react'
import { NAV_GROUPS, type PageId } from '@/lib/navigation'
import { SidebarItem } from './SidebarItem'
import { SidebarGroup } from './SidebarGroup'

interface SidebarProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-8 w-8 place-content-center rounded-lg bg-accent/15 text-accent">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-text">CodeShredder</p>
          <p className="text-[11px] leading-tight text-faint">fast dev cleanup</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label ?? group.items[0].id} label={group.label}>
            {group.items.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activePage === item.id}
                onClick={() => onNavigate(item.id)}
              />
            ))}
          </SidebarGroup>
        ))}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <div className="flex items-start gap-2.5 rounded-lg bg-panel px-3 py-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
          <p className="text-[11px] leading-snug text-muted">
            Nothing is deleted on first use. Items move to your Trash so you can
            recover them.
          </p>
        </div>
      </div>
    </aside>
  )
}
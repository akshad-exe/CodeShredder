import type { ReactNode } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import type { PageId } from '@/lib/navigation'

interface AppShellProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
  children: ReactNode
}

export function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-text">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <main className="no-scrollbar flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
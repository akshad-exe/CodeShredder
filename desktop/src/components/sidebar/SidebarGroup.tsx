import type { ReactNode } from 'react'

export function SidebarGroup({
  label,
  children,
}: {
  label?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1">
      {label && (
        <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-faint">
          {label}
        </p>
      )}
      {children}
    </div>
  )
}

export default SidebarGroup
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  /** When true, marks the state as sample/preview data. */
  sample?: boolean
}

export function EmptyState({ icon: Icon, title, description, action, sample }: EmptyStateProps) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border bg-panel px-4 py-16 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-content-center rounded-xl bg-panel-2 text-faint">
          <Icon className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm font-medium text-text">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted">{description}</p>
        {action && <div className="mt-4 flex justify-center">{action}</div>}
        {sample && (
          <span className="mt-4 inline-block rounded-full border border-border bg-panel-2 px-2.5 py-0.5 text-[11px] text-faint">
            Sample data — browser preview only
          </span>
        )}
      </div>
    </div>
  )
}

import { Construction } from 'lucide-react'

interface PlaceholderProps {
  title: string
  description: string
}

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="w-full px-8 py-8">
      <h1 className="text-2xl font-bold text-text">{title}</h1>
      <p className="mt-1 text-sm text-muted">{description}</p>

      <div className="mt-8 grid place-items-center rounded-xl border border-dashed border-border bg-panel px-4 py-16 text-center">
        <div>
          <div className="mx-auto grid h-12 w-12 place-content-center rounded-xl bg-panel-2 text-faint">
            <Construction className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-text">Coming soon</p>
          <p className="mt-1 max-w-sm text-xs text-muted">
            This screen ships in a later milestone. Shred is the complete flow
            for now.
          </p>
        </div>
      </div>
    </div>
  )
}
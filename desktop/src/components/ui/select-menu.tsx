import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option<T> {
  label: string
  value: T
}

/** Themed dropdown. Native <select> popups ignore the app theme on Linux and
 * Windows WebViews, so this renders its own list. Closes on outside click or Esc. */
export function SelectMenu<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: Option<NoInfer<T>>[]
  onChange: (value: NoInfer<T>) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex min-w-[140px] items-center justify-between gap-2 rounded-lg border bg-panel px-3 py-2 text-sm text-text transition-colors',
          open ? 'border-accent' : 'border-border hover:border-accent/50',
        )}
      >
        {current.label}
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-30 mt-1 min-w-full overflow-hidden rounded-lg border border-border bg-panel-2 p-1 shadow-xl"
        >
          {options.map((o) => (
            <li key={String(o.value)}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-sm',
                  o.value === value ? 'bg-accent/15 text-text' : 'text-muted hover:bg-panel hover:text-text',
                )}
              >
                {o.label}
                {o.value === value && <Check className="h-3.5 w-3.5 text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

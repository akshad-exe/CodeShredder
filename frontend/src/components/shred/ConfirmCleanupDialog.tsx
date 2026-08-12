import { Recycle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatBytes, formatCount } from '@/lib/format'
import { useCleanupStore } from '@/store/cleanupStore'

interface ConfirmCleanupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmCleanupDialog({
  open,
  onOpenChange,
  onConfirm,
}: ConfirmCleanupDialogProps) {
  const targets = useCleanupStore((s) => s.targets)
  const selectedTargets = useCleanupStore((s) => s.selectedTargets)

  const selected = targets.filter((t) => selectedTargets.has(t.id))
  const selectedSize = selected.reduce((acc, t) => acc + t.sizeBytes, 0)
  const dangerCount = selected.filter((t) => t.safetyLevel === 'dangerous').length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-panel">
        <DialogHeader>
          <div className="mb-2 grid h-10 w-10 place-content-center rounded-full bg-safe/10 text-safe">
            <Recycle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-base text-text">
            Move to Trash?
          </DialogTitle>
          <DialogDescription className="text-muted">
            You selected{' '}
            <span className="font-medium text-text">{formatCount(selected.length)}</span>{' '}
            folders (
            <span className="font-medium tabular-nums text-text">
              {formatBytes(selectedSize)}
            </span>
            ). They'll be moved to your Operating System's Trash / Recycle Bin,
            so you can recover them if you change your mind.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-background/60 px-4 py-3">
          <p className="text-xs leading-relaxed text-muted">
            {dangerCount > 0 ? (
              <>
                <span className="font-semibold text-warning">
                  {dangerCount} flagged for review.
                </span>{' '}
                Review these before deleting — you won't be able to rebuild them
                easily.
              </>
            ) : (
              'All selected items are rebuildable — dependencies and build output can be regenerated with your package manager.'
            )}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            Move {formatCount(selected.length)} to Trash
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
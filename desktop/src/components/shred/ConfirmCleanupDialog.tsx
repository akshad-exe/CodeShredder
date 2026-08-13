import { Recycle, Zap } from 'lucide-react'
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
  const deleteMode = useCleanupStore((s) => s.settings.deleteMode)

  const selected = targets.filter((t) => selectedTargets.has(t.id))
  const selectedSize = selected.reduce((acc, t) => acc + t.sizeBytes, 0)
  const dangerCount = selected.filter((t) => t.safetyLevel === 'dangerous').length
  const mediumCount = selected.filter((t) => t.safetyLevel === 'medium').length

  const isPermanent = deleteMode === 'permanent'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-panel">
        <DialogHeader>
          <div
            className={`mb-2 grid h-10 w-10 place-content-center rounded-full ${
              isPermanent ? 'bg-danger/10 text-danger' : 'bg-safe/10 text-safe'
            }`}
          >
            {isPermanent ? (
              <Zap className="h-5 w-5" />
            ) : (
              <Recycle className="h-5 w-5" />
            )}
          </div>
          <DialogTitle className="text-base text-text">
            {isPermanent
              ? 'Permanently delete these folders?'
              : 'Move to Trash?'}
          </DialogTitle>
          <DialogDescription className="text-muted">
            {isPermanent ? (
              <>
                You selected{' '}
                <span className="font-medium text-text">{formatCount(selected.length)}</span>{' '}
                folders (
                <span className="font-medium tabular-nums text-text">
                  {formatBytes(selectedSize)}
                </span>
                ). This <span className="font-semibold text-danger">cannot be undone</span>.
              </>
            ) : (
              <>
                You selected{' '}
                <span className="font-medium text-text">{formatCount(selected.length)}</span>{' '}
                folders (
                <span className="font-medium tabular-nums text-text">
                  {formatBytes(selectedSize)}
                </span>
                ). They'll be moved to your Operating System's Trash / Recycle Bin,
                so you can recover them if you change your mind.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {(isPermanent || dangerCount > 0 || mediumCount > 0) && (
          <div className="rounded-lg border border-border bg-background/60 px-4 py-3">
            <p className="text-xs leading-relaxed text-muted">
              {isPermanent ? (
                <span className="font-semibold text-danger">
                  This permanently deletes {formatCount(selected.length)} folders
                  from disk. You will not be able to recover them.
                </span>
              ) : (
                <>
                  {dangerCount > 0 && (
                    <>
                      <span className="font-semibold text-warning">
                        {dangerCount} flagged for review.
                      </span>{' '}
                    </>
                  )}
                  {mediumCount > 0 && (
                    <>
                      <span className="font-semibold text-warning">
                        {mediumCount} need setup to restore.
                      </span>{' '}
                    </>
                  )}
                  {dangerCount === 0 && mediumCount === 0
                    ? 'All selected items are rebuildable — dependencies and build output can be regenerated with your package manager.'
                    : 'Double-check these before continuing.'}
                </>
              )}
            </p>
          </div>
        )}

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
            className={isPermanent ? 'btn-danger' : 'btn-primary'}
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            {isPermanent
              ? `Permanently delete ${formatCount(selected.length)}`
              : `Move ${formatCount(selected.length)} to Trash`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

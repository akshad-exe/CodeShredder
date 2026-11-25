import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** A pending irreversible action, or `null` when nothing awaits confirmation. */
export interface PendingConfirm {
  title: string
  description: string
  actionLabel: string
  run: () => void
}

export function ConfirmDialog({
  pending,
  onClose,
}: {
  pending: PendingConfirm | null
  onClose: () => void
}) {
  return (
    <Dialog open={pending !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-border bg-panel">
        <DialogHeader>
          <DialogTitle className="text-base text-text">{pending?.title}</DialogTitle>
          <DialogDescription className="text-muted">
            {pending?.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              onClose()
              pending?.run()
            }}
          >
            {pending?.actionLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

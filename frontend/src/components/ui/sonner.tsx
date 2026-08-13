import { Toaster as Sonner, toast } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:!bg-panel group-[.toaster]:!text-text group-[.toaster]:!border-border group-[.toaster]:!rounded-lg group-[.toaster]:!shadow-lg',
          description: 'group-[.toast]:!text-muted',
          actionButton: 'group-[.toast]:!bg-accent group-[.toast]:!text-white',
          cancelButton: 'group-[.toast]:!bg-panel-2 group-[.toast]:!text-muted',
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }

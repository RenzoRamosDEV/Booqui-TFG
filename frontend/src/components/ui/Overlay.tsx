import { X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { overlayTransition, type OverlayPlacement } from '../../lib/motion'
import { useFocusTrap } from '../../lib/use-focus-trap'
import { focusRing } from './button-styles'

export type OverlayProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

const placements: Record<OverlayPlacement, { wrapper: string; panel: string }> = {
  center: {
    wrapper: 'items-center justify-center p-4',
    panel: 'w-full max-w-lg rounded-lg',
  },
  right: {
    wrapper: 'justify-end',
    panel: 'h-full w-80 max-w-[85vw] rounded-l-lg',
  },
}

export function Overlay({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  placement,
}: OverlayProps & { placement: OverlayPlacement }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const reduced = useReducedMotion() ?? false
  const motionPreset = overlayTransition(reduced, placement)

  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 z-50 flex', placements[placement].wrapper)}>
          <motion.div
            data-testid="overlay-backdrop"
            aria-hidden="true"
            className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm dark:bg-black/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            initial={motionPreset.initial}
            animate={motionPreset.animate}
            exit={motionPreset.exit}
            transition={motionPreset.transition}
            className={cn(
              'relative flex flex-col gap-4 border border-border bg-surface p-6 text-fg shadow-lg outline-none',
              placements[placement].panel,
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 id={titleId} className="text-lg font-semibold">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="text-sm text-fg-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-md text-fg-muted transition-colors hover:bg-brand-50 hover:text-fg dark:hover:bg-white/5',
                  focusRing,
                )}
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
            {children}
            {footer && <div className="mt-2 flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

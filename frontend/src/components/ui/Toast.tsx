import { CircleAlert, CircleCheck, Info, X, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { toastTransition } from '../../lib/motion'
import { focusRing } from './button-styles'
import { ToastContext, type ToastOptions, type ToastTone } from './use-toast'

type ToastEntry = Required<Pick<ToastOptions, 'title' | 'tone' | 'duration'>> &
  Pick<ToastOptions, 'description'> & { id: number }

const DEFAULT_DURATION = 4000

const tones: Record<ToastTone, { icon: LucideIcon; className: string }> = {
  info: { icon: Info, className: 'text-brand-600 dark:text-brand-300' },
  success: { icon: CircleCheck, className: 'text-success' },
  danger: { icon: CircleAlert, className: 'text-danger' },
}

function ToastItem({ toast, onDismiss }: { toast: ToastEntry; onDismiss: (id: number) => void }) {
  const reduced = useReducedMotion() ?? false
  const preset = toastTransition(reduced)
  const { icon: Icon, className } = tones[toast.tone]

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <motion.div
      layout={!reduced}
      initial={preset.initial}
      animate={preset.animate}
      exit={preset.exit}
      transition={preset.transition}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-glass-border bg-glass p-4 text-fg shadow-lg backdrop-blur-xl"
    >
      <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', className)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && <p className="text-sm text-fg-muted">{toast.description}</p>}
      </div>
      <button
        type="button"
        aria-label="Cerrar notificación"
        onClick={() => onDismiss(toast.id)}
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-md text-fg-muted transition-colors hover:text-fg',
          focusRing,
        )}
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback((options: ToastOptions) => {
    nextId.current += 1
    const id = nextId.current
    setToasts((current) => [
      ...current,
      {
        id,
        title: options.title,
        description: options.description,
        tone: options.tone ?? 'info',
        duration: options.duration ?? DEFAULT_DURATION,
      },
    ])
    return id
  }, [])

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

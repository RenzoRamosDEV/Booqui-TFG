import { createContext, useContext } from 'react'

export type ToastTone = 'info' | 'success' | 'danger'

export type ToastOptions = {
  title: string
  description?: string
  tone?: ToastTone
  duration?: number
}

export type ToastApi = {
  show: (options: ToastOptions) => number
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast must be used inside ToastProvider')
  return api
}

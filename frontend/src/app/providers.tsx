import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { ToastProvider } from '../components/ui/Toast'
import { createQueryClient } from '../lib/query-client'

export function Providers({
  children,
  queryClient: injectedClient,
}: {
  children: ReactNode
  queryClient?: QueryClient
}) {
  const [queryClient] = useState(() => injectedClient ?? createQueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <ToastProvider>{children}</ToastProvider>
      </MotionConfig>
    </QueryClientProvider>
  )
}

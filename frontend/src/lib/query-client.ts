import { QueryClient } from '@tanstack/react-query'
import { ApiError, NETWORK_ERROR_STATUS } from './api-error'

const MAX_RETRIES = 1

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES || !(error instanceof ApiError)) return false
  return error.status === NETWORK_ERROR_STATUS || error.status >= 500
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  })
}

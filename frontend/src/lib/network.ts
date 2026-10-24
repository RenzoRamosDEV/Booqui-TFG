import { useSyncExternalStore } from 'react'
import { ApiError, NETWORK_ERROR_STATUS } from './api-error'

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === NETWORK_ERROR_STATUS
}

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

function isOnline() {
  return navigator.onLine
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, isOnline)
}

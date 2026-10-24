import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { toApiError } from '../lib/api-error'
import { userMessage, type MessageOverrides } from '../lib/error-messages'
import { isNetworkError } from '../lib/network'
import { OfflineState } from './OfflineState'
import { Button } from './ui/Button'

export type QueryLike<T> = {
  data: T | undefined
  error: unknown
  isPending: boolean
  refetch: () => unknown
}

export type QueryStateProps<T> = {
  query: QueryLike<T>
  label: string
  skeleton: ReactNode
  children: (data: T) => ReactNode
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  errorOverrides?: MessageOverrides
}

export function QueryState<T>({
  query,
  label,
  skeleton,
  children,
  isEmpty,
  empty,
  errorOverrides,
}: QueryStateProps<T>) {
  const retry = () => void query.refetch()

  if (query.error) {
    if (isNetworkError(query.error)) return <OfflineState onRetry={retry} />
    return (
      <div
        role="alert"
        className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg border border-danger/30 bg-danger/5 px-6 py-10 text-center"
      >
        <CircleAlert aria-hidden="true" className="size-8 text-danger" />
        <p className="font-medium text-fg">
          {userMessage(toApiError(query.error), errorOverrides)}
        </p>
        <Button variant="secondary" onClick={retry}>
          Reintentar
        </Button>
      </div>
    )
  }

  if (query.isPending || query.data === undefined) {
    return (
      <section aria-busy="true" aria-label={label}>
        {skeleton}
      </section>
    )
  }

  if (empty && isEmpty?.(query.data)) return <>{empty}</>
  return <>{children(query.data)}</>
}

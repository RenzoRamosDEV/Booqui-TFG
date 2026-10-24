import { useState } from 'react'
import { cn } from '../../../lib/cn'
import type { EventResponse } from '../../../types/event'
import { CategoryIcon } from './CategoryIcon'

export type EventImageProps = {
  event: Pick<EventResponse, 'title' | 'imageUrl' | 'category'>
  className?: string
  decorative?: boolean
  eager?: boolean
}

export function EventImage({
  event,
  className,
  decorative = false,
  eager = false,
}: EventImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const label = decorative ? {} : { role: 'img', 'aria-label': event.title }

  if (!event.imageUrl || failedUrl === event.imageUrl) {
    return (
      <div
        data-testid="event-image-fallback"
        {...label}
        aria-hidden={decorative || undefined}
        className={cn(
          'relative isolate grid place-items-center overflow-hidden bg-gradient-to-br from-brand-500 via-brand-700 to-brand-950',
          className,
        )}
      >
        <div className="event-fallback-pattern absolute inset-0 -z-10 opacity-40" />
        <div className="absolute -top-10 -right-8 -z-10 size-40 rounded-full bg-white/15 blur-2xl" />
        <div className="flex flex-col items-center gap-2 text-white/90">
          <CategoryIcon category={event.category} className="size-10" strokeWidth={1.5} />
          <span className="font-display text-sm font-semibold tracking-wide">Booqi</span>
        </div>
      </div>
    )
  }

  return (
    <img
      src={event.imageUrl}
      alt={decorative ? '' : event.title}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailedUrl(event.imageUrl)}
      className={cn('object-cover', className)}
    />
  )
}

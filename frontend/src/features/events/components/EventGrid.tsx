import { motion, useReducedMotion } from 'motion/react'
import { Skeleton } from '../../../components/ui/Skeleton'
import { cn } from '../../../lib/cn'
import { listStagger } from '../../../lib/motion'
import type { EventResponse } from '../../../types/event'
import { EventCard } from './EventCard'

const gridClass = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'

export type EventGridProps = {
  events: EventResponse[]
  onAddToCart?: (event: EventResponse) => void
  label?: string
  className?: string
}

export function EventGrid({ events, onAddToCart, label, className }: EventGridProps) {
  const reduced = useReducedMotion() ?? false
  const { container, item } = listStagger(reduced)
  return (
    <motion.ul
      aria-label={label}
      variants={container}
      initial="hidden"
      animate="visible"
      className={cn(gridClass, className)}
    >
      {events.map((event) => (
        <motion.li key={event.id} variants={item}>
          <EventCard event={event} onAddToCart={onAddToCart} />
        </motion.li>
      ))}
    </motion.ul>
  )
}

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={gridClass}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface"
        >
          <Skeleton className="aspect-[16/10] rounded-none" />
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-3 h-7 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

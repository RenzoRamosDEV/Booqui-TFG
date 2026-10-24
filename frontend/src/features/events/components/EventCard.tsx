import { CalendarDays, MapPin, ShoppingBag } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { Badge } from '../../../components/ui/Badge'
import { formatShortDate, formatTime } from '../../../lib/dates'
import { hoverLift } from '../../../lib/motion'
import type { EventResponse } from '../../../types/event'
import { availability, priceLabel } from '../hooks/event-labels'
import { EventImage } from './EventImage'

export type EventCardProps = {
  event: EventResponse
  onAddToCart?: (event: EventResponse) => void
}

export function EventCard({ event, onAddToCart }: EventCardProps) {
  const reduced = useReducedMotion() ?? false
  const stock = availability(event.availableTickets)
  return (
    <motion.article
      {...hoverLift(reduced)}
      className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-md transition-shadow duration-200 hover:shadow-lg hover:shadow-brand-600/15 dark:shadow-sm dark:hover:border-brand-700"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <EventImage
          event={event}
          decorative
          className="size-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
        <Badge className="absolute top-3 left-3 border-white/30 bg-white/85 text-brand-800 backdrop-blur dark:border-white/10 dark:bg-black/50 dark:text-brand-200">
          {event.category}
        </Badge>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white">
          <CalendarDays aria-hidden="true" className="size-3.5" />
          {formatShortDate(event.startDate)} · {formatTime(event.startDate)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-lg leading-snug font-semibold text-fg">
          <Link
            to={`/events/${event.id}`}
            className="outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-bg"
          >
            {event.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-fg-muted">
          <MapPin aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{event.location}</span>
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="flex flex-col gap-1">
            <span className="font-display text-xl font-bold text-fg">
              {priceLabel(event.price)}
            </span>
            {stock.tone !== 'success' && <Badge tone={stock.tone}>{stock.label}</Badge>}
          </div>
          {onAddToCart && (
            <button
              type="button"
              aria-label={`Añadir ${event.title} al carrito`}
              disabled={stock.soldOut}
              onClick={() => onAddToCart(event)}
              className="relative z-10 grid size-11 place-items-center rounded-md bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors duration-150 outline-none hover:bg-brand-600 hover:text-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand-50 disabled:hover:text-brand-700 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/20 dark:hover:bg-brand-500 dark:hover:text-white"
            >
              <ShoppingBag aria-hidden="true" className="size-5" />
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}

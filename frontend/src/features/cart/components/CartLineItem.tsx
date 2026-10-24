import { CalendarDays, MapPin, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { QuantitySelector } from '../../../components/QuantitySelector'
import { focusRing } from '../../../components/ui/button-styles'
import { cn } from '../../../lib/cn'
import { formatShortDate, formatTime } from '../../../lib/dates'
import { formatEuro } from '../../../lib/money'
import { EventImage } from '../../events/components/EventImage'
import { priceLabel } from '../../events/hooks/event-labels'
import { lineTotalCents, maxQuantity, useCartStore, type CartLine } from '../hooks/cart-store'

export function CartLineItem({ line }: { line: CartLine }) {
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)
  const { event, quantity } = line
  return (
    <motion.li
      layout
      aria-label={event.title}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center"
    >
      <EventImage
        event={event}
        decorative
        className="aspect-[16/10] w-full shrink-0 rounded-md sm:w-32"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          to={`/events/${event.id}`}
          className={cn(
            'rounded-sm font-display text-lg font-semibold text-fg hover:underline',
            focusRing,
          )}
        >
          {event.title}
        </Link>
        <p className="flex items-center gap-1.5 text-sm text-fg-muted">
          <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
          {formatShortDate(event.startDate)} · {formatTime(event.startDate)}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-fg-muted">
          <MapPin aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{event.location}</span>
        </p>
        <p className="text-sm font-medium text-fg">{priceLabel(event.price)} / entrada</p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <QuantitySelector
          value={quantity}
          min={0}
          max={maxQuantity(event)}
          onChange={(value) => setQuantity(event.id, value)}
          label={`Cantidad de ${event.title}`}
          decreaseLabel={`Quitar una entrada de ${event.title}`}
          increaseLabel={`Añadir una entrada de ${event.title}`}
          valueLabel={`Entradas de ${event.title}`}
        />
        <div className="flex items-center gap-2">
          <span data-line-total className="font-display text-lg font-bold text-fg">
            {formatEuro(lineTotalCents(line))}
          </span>
          <button
            type="button"
            aria-label={`Eliminar ${event.title} del carrito`}
            onClick={() => remove(event.id)}
            className={cn(
              'grid size-10 place-items-center rounded-md text-fg-muted transition-colors hover:bg-danger/10 hover:text-danger',
              focusRing,
            )}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </motion.li>
  )
}

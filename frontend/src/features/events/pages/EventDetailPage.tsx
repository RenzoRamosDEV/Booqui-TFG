import {
  ArrowLeft,
  CalendarClock,
  CalendarX,
  ExternalLink,
  MapPin,
  ShoppingBag,
  Tag,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { PageMeta } from '../../../app/PageMeta'
import { QueryState } from '../../../components/QueryState'
import { QuantitySelector } from '../../../components/QuantitySelector'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { ButtonLink } from '../../../components/ui/ButtonLink'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Skeleton } from '../../../components/ui/Skeleton'
import { focusRing } from '../../../components/ui/button-styles'
import { ApiError } from '../../../lib/api-error'
import { cn } from '../../../lib/cn'
import { formatDateTime } from '../../../lib/dates'
import { formatEuro, toCents } from '../../../lib/money'
import type { EventResponse } from '../../../types/event'
import { maxQuantity } from '../../cart/hooks/cart-store'
import { useAddToCart } from '../../cart/hooks/use-add-to-cart'
import { EventImage } from '../components/EventImage'
import { availability, priceLabel } from '../hooks/event-labels'
import { useEvent } from '../hooks/use-events'

function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

function EventNotFound() {
  return (
    <>
      <PageMeta title="Evento no encontrado" description="El evento que buscas no existe." />
      <EmptyState
        icon={CalendarX}
        title="Evento no encontrado"
        description="Puede que se haya eliminado o que el enlace no sea correcto."
        action={<ButtonLink to="/events">Ver todos los eventos</ButtonLink>}
      />
    </>
  )
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/20">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col">
        <dt className="text-xs font-semibold tracking-wide text-fg-muted uppercase">{label}</dt>
        <dd className="text-fg">{children}</dd>
      </div>
    </div>
  )
}

function PurchasePanel({ event }: { event: EventResponse }) {
  const [quantity, setQuantity] = useState(1)
  const addToCart = useAddToCart()
  const stock = availability(event.availableTickets)
  const max = maxQuantity(event)
  const unitCents = toCents(event.price)

  return (
    <aside
      aria-label="Comprar entradas"
      className="flex flex-col gap-5 rounded-xl border border-glass-border bg-glass p-6 shadow-lg backdrop-blur-xl lg:sticky lg:top-28 lg:self-start"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm text-fg-muted">Precio por entrada</span>
          <span className="font-display text-3xl font-bold text-fg">{priceLabel(event.price)}</span>
        </div>
        <Badge tone={stock.tone}>{stock.label}</Badge>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-fg">Entradas</span>
        <QuantitySelector
          value={quantity}
          max={max}
          onChange={setQuantity}
          disabled={stock.soldOut}
        />
      </div>
      <div
        data-testid="price-summary"
        className="flex items-center justify-between border-t border-border pt-4 text-sm"
      >
        <span className="text-fg-muted">
          {quantity} × {priceLabel(event.price)}
        </span>
        <span className="font-display text-lg font-bold text-fg">
          {unitCents === 0 ? 'Gratis' : formatEuro(unitCents * quantity)}
        </span>
      </div>
      <Button
        size="lg"
        disabled={stock.soldOut}
        onClick={() => {
          addToCart(event, quantity)
          setQuantity(1)
        }}
      >
        <ShoppingBag aria-hidden="true" className="size-5" />
        Añadir al carrito
      </Button>
      <p className="text-center text-xs text-fg-muted">Máximo 10 entradas por evento.</p>
    </aside>
  )
}

function EventDetail({ event }: { event: EventResponse }) {
  return (
    <article className="flex flex-col gap-8">
      <PageMeta
        title={event.title}
        description={(event.description ?? `${event.title} en ${event.location}`).slice(0, 155)}
      />
      <Link
        to="/events"
        className={cn(
          'inline-flex w-fit items-center gap-2 rounded-md text-sm font-medium text-fg-muted transition-colors hover:text-fg',
          focusRing,
        )}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver a eventos
      </Link>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <div className="relative overflow-hidden rounded-xl shadow-lg ring-1 ring-border">
            <EventImage key={event.imageUrl} event={event} eager className="aspect-[16/9] w-full" />
          </div>
          <div className="flex flex-col gap-3">
            <Badge tone="brand" className="w-fit">
              {event.category}
            </Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-fg sm:text-5xl">
              {event.title}
            </h1>
            {event.description && (
              <p className="max-w-prose text-lg leading-relaxed text-fg-muted">
                {event.description}
              </p>
            )}
          </div>
          <dl className="grid gap-5 rounded-xl border border-border bg-surface p-6 shadow-sm sm:grid-cols-2">
            <InfoRow icon={CalendarClock} label="Empieza">
              {formatDateTime(event.startDate)}
            </InfoRow>
            <InfoRow icon={CalendarClock} label="Termina">
              {formatDateTime(event.endDate)}
            </InfoRow>
            <InfoRow icon={MapPin} label="Lugar">
              <span className="block">{event.location}</span>
              <a
                href={mapsUrl(event.location)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300',
                  focusRing,
                )}
              >
                Ver en Google Maps
                <ExternalLink aria-hidden="true" className="size-3.5" />
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            </InfoRow>
            <InfoRow icon={UserRound} label="Organiza">
              {event.organizer}
            </InfoRow>
            <InfoRow icon={Tag} label="Categoría">
              {event.category}
            </InfoRow>
          </dl>
        </div>
        <PurchasePanel event={event} />
      </div>
    </article>
  )
}

function DetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-6">
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}

function LoadedEvent({ id }: { id: number }) {
  const event = useEvent(id)
  if (event.error instanceof ApiError && event.error.status === 404) return <EventNotFound />
  return (
    <>
      {!event.data && (
        <PageMeta
          title="Detalle del evento"
          description="Fecha, lugar, precio y entradas disponibles del evento."
        />
      )}
      <QueryState query={event} label="Cargando evento" skeleton={<DetailSkeleton />}>
        {(data) => <EventDetail event={data} />}
      </QueryState>
    </>
  )
}

export function EventDetailPage() {
  const id = Number(useParams().id)
  if (!Number.isInteger(id) || id <= 0) return <EventNotFound />
  return <LoadedEvent key={id} id={id} />
}

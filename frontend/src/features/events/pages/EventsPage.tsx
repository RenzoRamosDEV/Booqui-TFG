import { SearchX } from 'lucide-react'
import { PageMeta } from '../../../app/PageMeta'
import { PageHeader } from '../../../components/PageHeader'
import { QueryState } from '../../../components/QueryState'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Pagination } from '../../../components/ui/Pagination'
import type { EventResponse } from '../../../types/event'
import { useAddToCart } from '../../cart/hooks/use-add-to-cart'
import { EventFilters } from '../components/EventFilters'
import { EventGrid, EventGridSkeleton } from '../components/EventGrid'
import { applyEventFilters, paginate } from '../hooks/event-filters'
import { useEventFilters } from '../hooks/use-event-filters'
import { useEvents } from '../hooks/use-events'

function resultsLabel(count: number) {
  return count === 1 ? '1 evento' : `${count} eventos`
}

export function EventsPage() {
  const events = useEvents()
  const { filters, hasFilters, setFilter, setFilters, setPage, clear } = useEventFilters()
  const addToCart = useAddToCart()

  function goToPage(page: number) {
    setPage(page)
    document.getElementById('main')?.scrollIntoView?.({ block: 'start' })
  }

  function results(all: EventResponse[]) {
    const matching = applyEventFilters(all, filters)
    if (matching.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="Ningún evento coincide con tu búsqueda"
          description="Prueba con otros filtros o explora todos los eventos."
          action={<Button onClick={clear}>Limpiar filtros</Button>}
        />
      )
    }
    const page = paginate(matching, filters.page)
    return (
      <div className="flex flex-col gap-8">
        <p aria-live="polite" className="text-sm text-fg-muted">
          {resultsLabel(matching.length)}
          {page.totalPages > 1 && ` · página ${page.page} de ${page.totalPages}`}
        </p>
        <EventGrid
          key={page.page}
          label="Resultados"
          events={page.items}
          onAddToCart={(event) => addToCart(event, 1)}
        />
        <Pagination page={page.page} totalPages={page.totalPages} onPageChange={goToPage} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PageMeta
        title="Eventos"
        description="Explora todos los eventos disponibles en Booqi y filtra por categoría, ciudad, fecha o precio."
      />
      <PageHeader
        eyebrow="Explora"
        title="Eventos"
        description="Encuentra tu próximo plan por categoría, ciudad, fecha o precio."
      />
      <EventFilters
        filters={filters}
        hasFilters={hasFilters}
        onChange={setFilter}
        onApply={setFilters}
        onClear={clear}
      />
      <QueryState query={events} label="Cargando eventos" skeleton={<EventGridSkeleton />}>
        {results}
      </QueryState>
    </div>
  )
}

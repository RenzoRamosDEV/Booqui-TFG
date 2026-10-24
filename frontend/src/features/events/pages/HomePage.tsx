import { ArrowRight, CalendarHeart, Search } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { PageMeta } from '../../../app/PageMeta'
import { BrandBackdrop } from '../../../components/BrandBackdrop'
import { QueryState } from '../../../components/QueryState'
import { Button } from '../../../components/ui/Button'
import { ButtonLink } from '../../../components/ui/ButtonLink'
import { EmptyState } from '../../../components/ui/EmptyState'
import { focusRing } from '../../../components/ui/button-styles'
import { cn } from '../../../lib/cn'
import { listStagger } from '../../../lib/motion'
import { useAddToCart } from '../../cart/hooks/use-add-to-cart'
import { EVENT_CATEGORIES } from '../api/categories'
import { CategoryIcon } from '../components/CategoryIcon'
import { EventGrid, EventGridSkeleton } from '../components/EventGrid'
import { serializeEventFilters } from '../hooks/event-filters'
import { homeSections, type HomeSections } from '../hooks/home-sections'
import { useEvents } from '../hooks/use-events'

function listingUrl(filters: { q?: string; category?: string }) {
  const search = serializeEventFilters({ ...filters, page: 1 }).toString()
  return search ? `/events?${search}` : '/events'
}

function Hero() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const reduced = useReducedMotion() ?? false
  const { container, item } = listStagger(reduced)

  function search(event: FormEvent) {
    event.preventDefault()
    navigate(listingUrl({ q: query.trim() || undefined }))
  }

  return (
    <section className="relative isolate -mx-4 px-4 pt-6 pb-4 sm:pt-12">
      <BrandBackdrop />
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center"
      >
        <motion.span
          variants={item}
          className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300"
        >
          <CalendarHeart aria-hidden="true" className="size-3.5" />
          Conciertos, arte, deporte y mucho más
        </motion.span>
        <motion.h1
          variants={item}
          className="font-display text-4xl leading-[1.05] font-bold tracking-tight text-fg sm:text-6xl"
        >
          Tus eventos favoritos,{' '}
          <span className="text-gradient-brand whitespace-nowrap">sin colas</span>
        </motion.h1>
        <motion.p variants={item} className="max-w-xl text-lg text-fg-muted">
          Descubre planes cerca de ti, elige tus entradas y llévalas siempre contigo.
        </motion.p>
        <motion.form
          variants={item}
          role="search"
          onSubmit={search}
          className="flex w-full max-w-xl items-center gap-2 rounded-xl border border-glass-border bg-glass p-2 shadow-lg backdrop-blur-xl"
        >
          <label htmlFor="home-search" className="sr-only">
            Buscar eventos
          </label>
          <Search aria-hidden="true" className="ml-2 size-5 shrink-0 text-fg-muted" />
          <input
            id="home-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busca un artista, evento u organizador"
            className="h-11 min-w-0 flex-1 rounded-md bg-transparent px-2 text-base text-fg placeholder:text-fg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
          <Button type="submit" className="shrink-0">
            Buscar
          </Button>
        </motion.form>
      </motion.div>
    </section>
  )
}

function CategoryShortcuts() {
  return (
    <nav aria-label="Categorías" className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold text-fg">Explora por categoría</h2>
      <ul className="flex flex-wrap gap-2">
        {EVENT_CATEGORIES.map((category) => (
          <li key={category}>
            <Link
              to={listingUrl({ category })}
              className={cn(
                'inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-fg shadow-sm transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 motion-reduce:hover:translate-y-0 dark:hover:border-brand-700 dark:hover:bg-brand-400/10',
                focusRing,
              )}
            >
              <CategoryIcon
                category={category}
                className="size-4 text-brand-600 dark:text-brand-300"
              />
              {category}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Sections({ sections }: { sections: HomeSections }) {
  const addToCart = useAddToCart()
  const onAdd = (event: Parameters<typeof addToCart>[0]) => addToCart(event, 1)
  return (
    <div className="flex flex-col gap-14">
      {sections.featured.length > 0 && (
        <section aria-labelledby="featured-title" className="flex flex-col gap-5">
          <h2 id="featured-title" className="font-display text-2xl font-bold text-fg">
            Destacados
          </h2>
          <EventGrid events={sections.featured} onAddToCart={onAdd} />
        </section>
      )}
      {sections.upcoming.length > 0 && (
        <section aria-labelledby="upcoming-title" className="flex flex-col gap-5">
          <h2 id="upcoming-title" className="font-display text-2xl font-bold text-fg">
            Próximos eventos
          </h2>
          <EventGrid events={sections.upcoming} onAddToCart={onAdd} />
        </section>
      )}
    </div>
  )
}

export function HomePage() {
  const events = useEvents()
  return (
    <div className="flex flex-col gap-14">
      <PageMeta
        title="Inicio"
        description="Descubre conciertos, exposiciones y experiencias, y reserva tus entradas en segundos."
      />
      <Hero />
      <CategoryShortcuts />
      <QueryState
        query={{
          data: events.data && homeSections(events.data, new Date()),
          error: events.error,
          isPending: events.isPending,
          refetch: events.refetch,
        }}
        label="Cargando eventos"
        skeleton={<EventGridSkeleton count={3} />}
        isEmpty={(sections) => sections.featured.length + sections.upcoming.length === 0}
        empty={
          <EmptyState
            icon={CalendarHeart}
            title="Todavía no hay eventos próximos"
            description="Vuelve pronto: estamos preparando nuevos planes."
          />
        }
      >
        {(sections) => <Sections sections={sections} />}
      </QueryState>
      <div className="flex justify-center">
        <ButtonLink to="/events" variant="secondary" size="lg">
          Ver todos los eventos
          <ArrowRight aria-hidden="true" className="size-4" />
        </ButtonLink>
      </div>
    </div>
  )
}

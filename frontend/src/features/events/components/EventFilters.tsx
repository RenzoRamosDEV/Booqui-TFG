import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { cn } from '../../../lib/cn'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { EVENT_CATEGORIES } from '../api/categories'
import { parseMaxPrice, type EventFilters as Filters, type FilterKey } from '../hooks/event-filters'

type Draft = { q: string; city: string; maxPrice: string }

function draftOf(filters: Filters): Draft {
  return { q: filters.q ?? '', city: filters.city ?? '', maxPrice: String(filters.maxPrice ?? '') }
}

export type EventFiltersProps = {
  filters: Filters
  hasFilters: boolean
  onChange: (key: FilterKey, value: string | undefined) => void
  onApply: (patch: Partial<Omit<Filters, 'page'>>) => void
  onClear: () => void
}

export function EventFilters({
  filters,
  hasFilters,
  onChange,
  onApply,
  onClear,
}: EventFiltersProps) {
  const [draft, setDraft] = useState(() => draftOf(filters))
  // Typed values live in a draft until submitted; reset it when the URL changes them (back, clear).
  const urlDraft = JSON.stringify(draftOf(filters))
  const [syncedDraft, setSyncedDraft] = useState(urlDraft)
  if (syncedDraft !== urlDraft) {
    setSyncedDraft(urlDraft)
    setDraft(draftOf(filters))
  }

  const secondaryActive = [
    filters.category,
    filters.city,
    filters.from,
    filters.to,
    filters.maxPrice,
  ].some((value) => value !== undefined)
  const [expanded, setExpanded] = useState(secondaryActive)
  const showSecondary = expanded || secondaryActive

  function submit(event: FormEvent) {
    event.preventDefault()
    onApply({
      q: draft.q.trim() || undefined,
      city: draft.city.trim() || undefined,
      maxPrice: parseMaxPrice(draft.maxPrice),
    })
  }

  return (
    <form
      role="search"
      aria-label="Filtrar eventos"
      onSubmit={submit}
      className="grid gap-4 rounded-lg border border-glass-border bg-glass p-4 shadow-md backdrop-blur-xl sm:grid-cols-2 sm:p-5 lg:grid-cols-6"
    >
      <Input
        type="search"
        label="Buscar"
        placeholder="Título, descripción u organizador"
        value={draft.q}
        onChange={(event) => setDraft({ ...draft, q: event.target.value })}
        className="sm:col-span-2"
      />
      <Button
        variant="secondary"
        aria-expanded={showSecondary}
        aria-controls="event-filters-more"
        onClick={() => setExpanded(!expanded)}
        className="sm:hidden"
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        {showSecondary ? 'Menos filtros' : 'Más filtros'}
      </Button>
      <div
        id="event-filters-more"
        className={cn(showSecondary ? 'contents' : 'hidden', 'sm:contents')}
      >
        <Select
          label="Categoría"
          value={filters.category ?? ''}
          onChange={(event) => onChange('category', event.target.value || undefined)}
        >
          <option value="">Todas</option>
          {EVENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        <Input
          label="Ciudad"
          placeholder="Madrid, Sevilla…"
          value={draft.city}
          onChange={(event) => setDraft({ ...draft, city: event.target.value })}
        />
        <Input
          type="date"
          label="Desde"
          value={filters.from ?? ''}
          max={filters.to}
          onChange={(event) => onChange('from', event.target.value || undefined)}
        />
        <Input
          type="date"
          label="Hasta"
          value={filters.to ?? ''}
          min={filters.from}
          onChange={(event) => onChange('to', event.target.value || undefined)}
        />
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          label="Precio máximo (€)"
          value={draft.maxPrice}
          onChange={(event) => setDraft({ ...draft, maxPrice: event.target.value })}
          className="sm:col-span-1 lg:col-span-2"
        />
      </div>
      <div className="flex flex-wrap items-end gap-2 sm:col-span-1 lg:col-span-4 lg:justify-end">
        {hasFilters && (
          <Button variant="ghost" onClick={onClear}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Restablecer
          </Button>
        )}
        <Button type="submit">
          <Search aria-hidden="true" className="size-4" />
          Aplicar
        </Button>
      </div>
    </form>
  )
}

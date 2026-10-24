import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { QueryState } from '../../../components/QueryState'
import { Button } from '../../../components/ui/Button'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../components/ui/use-toast'
import { toApiError } from '../../../lib/api-error'
import { formatShortDate, formatTime } from '../../../lib/dates'
import { userMessage } from '../../../lib/error-messages'
import type { EventResponse } from '../../../types/event'
import { availability, priceLabel } from '../../events/hooks/event-labels'
import { useEvents } from '../../events/hooks/use-events'
import { useDeleteEvent } from '../hooks/use-admin-mutations'
import { EventFormDialog } from './EventFormDialog'
import { cellClass, headCellClass, tableClass, tableFrameClass } from './table-styles'

type FormState = { open: false } | { open: true; event: EventResponse | null }

export function EventsTab({ onReport }: { onReport: (event: EventResponse) => void }) {
  const events = useEvents()
  const remove = useDeleteEvent()
  const toast = useToast()
  const [form, setForm] = useState<FormState>({ open: false })
  const [pending, setPending] = useState<EventResponse | null>(null)

  function confirmDelete() {
    if (!pending) return
    remove.mutate(pending.id, {
      onSuccess: () =>
        toast.show({ tone: 'success', title: 'Evento eliminado', description: pending.title }),
      onError: (error) => toast.show({ tone: 'danger', title: userMessage(toApiError(error)) }),
      onSettled: () => setPending(null),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setForm({ open: true, event: null })}>
          <Plus aria-hidden="true" className="size-4" />
          Nuevo evento
        </Button>
      </div>
      <QueryState
        query={events}
        label="Cargando eventos"
        skeleton={<Skeleton className="h-64 w-full" />}
      >
        {(list) => (
          <div className={tableFrameClass}>
            <table aria-label="Eventos" className={tableClass}>
              <thead>
                <tr>
                  <th className={headCellClass}>Evento</th>
                  <th className={headCellClass}>Fecha</th>
                  <th className={headCellClass}>Precio</th>
                  <th className={headCellClass}>Entradas</th>
                  <th className={headCellClass}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((event) => (
                  <tr
                    key={event.id}
                    className="transition-colors hover:bg-brand-50/50 dark:hover:bg-white/[0.03]"
                  >
                    <td className={cellClass}>
                      <span className="flex flex-col">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-xs text-fg-muted">
                          {event.category} · {event.location}
                        </span>
                      </span>
                    </td>
                    <td className={`${cellClass} whitespace-nowrap`}>
                      {formatShortDate(event.startDate)} · {formatTime(event.startDate)}
                    </td>
                    <td className={cellClass}>{priceLabel(event.price)}</td>
                    <td className={cellClass}>{availability(event.availableTickets).label}</td>
                    <td className={`${cellClass} text-right whitespace-nowrap`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Informe de ventas de ${event.title}`}
                        onClick={() => onReport(event)}
                      >
                        <FileText aria-hidden="true" className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Editar ${event.title}`}
                        onClick={() => setForm({ open: true, event })}
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Eliminar ${event.title}`}
                        onClick={() => setPending(event)}
                        className="text-danger hover:bg-danger/10 dark:hover:bg-danger/10"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </QueryState>
      <EventFormDialog
        open={form.open}
        event={form.open ? form.event : null}
        onClose={() => setForm({ open: false })}
      />
      <ConfirmDialog
        open={pending !== null}
        title="¿Eliminar evento?"
        description={
          pending
            ? `Se eliminará «${pending.title}». Las reservas y pagos existentes no cambian.`
            : ''
        }
        confirmLabel="Eliminar"
        busy={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setPending(null)}
      />
    </div>
  )
}

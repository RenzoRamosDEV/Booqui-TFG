import { useForm } from 'react-hook-form'
import { FormAlert } from '../../../components/FormAlert'
import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Textarea } from '../../../components/ui/Textarea'
import { useToast } from '../../../components/ui/use-toast'
import { changedFields } from '../../../lib/diff'
import { applyServerErrors } from '../../../lib/form-errors'
import { zodResolver } from '../../../lib/zod-resolver'
import type { EventResponse } from '../../../types/event'
import { EVENT_CATEGORIES } from '../../events/api/categories'
import {
  eventFormSchema,
  eventToFormValues,
  type EventFormValues,
} from '../../events/api/event-form-schema'
import { useCreateEvent, useUpdateEvent } from '../hooks/use-admin-mutations'

const FIELDS = [
  'title',
  'description',
  'availableTickets',
  'price',
  'location',
  'startDate',
  'endDate',
  'organizer',
  'category',
  'contactEmail',
  'contactPhone',
  'imageUrl',
] as const

const emptyForm: EventFormValues = {
  title: '',
  description: '',
  availableTickets: '',
  price: '',
  location: '',
  startDate: '',
  endDate: '',
  organizer: '',
  category: '',
  contactEmail: '',
  contactPhone: '',
  imageUrl: '',
}

function EventForm({ event, onDone }: { event: EventResponse | null; onDone: () => void }) {
  const toast = useToast()
  const create = useCreateEvent()
  const update = useUpdateEvent()
  const form = useForm({
    resolver: zodResolver(eventFormSchema(event ? 'edit' : 'create')),
    defaultValues: event ? eventToFormValues(event) : emptyForm,
  })
  const { errors, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (request) => {
    try {
      if (event) {
        const patch = changedFields(event, request)
        if (Object.keys(patch).length === 0) {
          toast.show({ title: 'No hay cambios que guardar' })
          return
        }
        await update.mutateAsync({ id: event.id, patch })
        toast.show({ tone: 'success', title: 'Evento actualizado', description: request.title })
      } else {
        await create.mutateAsync(request)
        toast.show({ tone: 'success', title: 'Evento creado', description: request.title })
      }
      onDone()
    } catch (error) {
      applyServerErrors(error, form.setError, { fields: FIELDS })
    }
  })

  const field = (name: (typeof FIELDS)[number]) => ({
    error: errors[name]?.message,
    ...form.register(name),
  })

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <FormAlert message={errors.root?.server?.message} />
      <Input label="Título" {...field('title')} />
      <Textarea label="Descripción" rows={3} {...field('description')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Entradas disponibles"
          type="number"
          min={0}
          step={1}
          {...field('availableTickets')}
        />
        <Input label="Precio (€)" type="number" min={0} step="0.01" {...field('price')} />
        <Input label="Inicio" type="datetime-local" {...field('startDate')} />
        <Input label="Fin" type="datetime-local" {...field('endDate')} />
        <Input label="Ubicación" {...field('location')} />
        <Input label="Organizador" {...field('organizer')} />
        <Select label="Categoría" {...field('category')}>
          <option value="">Elige una categoría</option>
          {EVENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        <Input label="URL de la imagen" type="url" placeholder="https://…" {...field('imageUrl')} />
        <Input label="Email de contacto" type="email" {...field('contactEmail')} />
        <Input label="Teléfono de contacto" type="tel" {...field('contactPhone')} />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {event ? 'Guardar cambios' : 'Crear evento'}
        </Button>
      </div>
    </form>
  )
}

export type EventFormDialogProps = {
  open: boolean
  event: EventResponse | null
  onClose: () => void
}

export function EventFormDialog({ open, event, onClose }: EventFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={event ? 'Editar evento' : 'Nuevo evento'}
      className="max-h-[90dvh] max-w-2xl overflow-y-auto"
    >
      <EventForm key={event?.id ?? 'new'} event={event} onDone={onClose} />
    </Dialog>
  )
}

import { z } from 'zod'
import type { CreateEventRequest, EventResponse } from '../../../types/event'
import { EVENT_CATEGORIES } from './categories'

export type EventFormMode = 'create' | 'edit'

export type EventFormValues = {
  title: string
  description: string
  availableTickets: string
  price: string
  location: string
  startDate: string
  endDate: string
  organizer: string
  category: string
  contactEmail: string
  contactPhone: string
  imageUrl: string
}

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const PHONE = /^\+?[0-9]{9,15}$/
const IMAGE_URL = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d+)?(\/.*)?$/

function sized(min: number, max: number, required: string, length: string) {
  return z.string().trim().min(1, required).min(min, length).max(max, length)
}

function dateTime(required: string) {
  return z.string().regex(DATE_TIME, required)
}

const tickets = z
  .string()
  .trim()
  .regex(/^-?\d+$/, 'Indica un número entero de entradas')
  .transform(Number)
  .pipe(z.number().min(0, 'El número de tickets no puede ser negativo'))

const price = z
  .string()
  .trim()
  .regex(/^-?\d+(\.\d+)?$/, 'Indica un precio')
  .transform(Number)
  .pipe(z.number().min(0, 'El precio no puede ser negativo'))

/** Converts the form into the backend request, enforcing the same rules as `CreateEventRequest`. */
export function eventFormSchema(mode: EventFormMode, now = new Date()) {
  return z
    .object({
      title: sized(
        3,
        200,
        'El título es obligatorio',
        'El título debe tener entre 3 y 200 caracteres',
      ),
      description: z.string().trim().max(2000, 'La descripción no puede exceder 2000 caracteres'),
      availableTickets: tickets,
      price,
      location: sized(
        3,
        200,
        'La ubicación es obligatoria',
        'La ubicación debe tener entre 3 y 200 caracteres',
      ),
      startDate: dateTime('La fecha de inicio es obligatoria'),
      endDate: dateTime('La fecha de fin es obligatoria'),
      organizer: sized(
        3,
        100,
        'El organizador es obligatorio',
        'El organizador debe tener entre 3 y 100 caracteres',
      ),
      category: z
        .string()
        .refine(
          (category) => (EVENT_CATEGORIES as readonly string[]).includes(category),
          'Elige una categoría',
        ),
      contactEmail: z.string().trim().pipe(z.email('El email de contacto debe ser válido')),
      contactPhone: z
        .string()
        .trim()
        .min(1, 'El teléfono de contacto es obligatorio')
        .regex(PHONE, 'El teléfono debe tener entre 9 y 15 dígitos'),
      imageUrl: z
        .string()
        .trim()
        .refine((url) => url === '' || IMAGE_URL.test(url), 'La URL de la imagen debe ser válida'),
    })
    .superRefine((values, context) => {
      if (mode === 'create' && new Date(values.startDate) <= now) {
        context.addIssue({
          code: 'custom',
          path: ['startDate'],
          message: 'La fecha de inicio debe ser en el futuro',
        })
      }
      if (values.endDate < values.startDate) {
        context.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: 'La fecha de fin no puede ser anterior a la de inicio',
        })
      }
    })
    .transform(({ description, imageUrl, startDate, endDate, ...values }): CreateEventRequest => ({
      title: values.title,
      ...(description ? { description } : {}),
      availableTickets: values.availableTickets,
      price: values.price,
      location: values.location,
      startDate: `${startDate}:00`,
      endDate: `${endDate}:00`,
      organizer: values.organizer,
      category: values.category,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      ...(imageUrl ? { imageUrl } : {}),
    }))
}

export function eventToFormValues(event: EventResponse): EventFormValues {
  return {
    title: event.title,
    description: event.description ?? '',
    availableTickets: String(event.availableTickets),
    price: String(event.price),
    location: event.location,
    startDate: event.startDate.slice(0, 16),
    endDate: event.endDate.slice(0, 16),
    organizer: event.organizer,
    category: event.category,
    contactEmail: event.contactEmail,
    contactPhone: event.contactPhone,
    imageUrl: event.imageUrl ?? '',
  }
}

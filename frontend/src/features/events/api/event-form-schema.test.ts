import { jazzEvent } from '../../../test/fixtures/events'
import { eventFormSchema, eventToFormValues, type EventFormValues } from './event-form-schema'

const now = new Date('2030-06-15T10:00:00')

const valid: EventFormValues = {
  title: 'Jazz en Madrid',
  description: '',
  availableTickets: '50',
  price: '12.5',
  location: 'IFEMA, Madrid',
  startDate: '2030-11-10T21:00',
  endDate: '2030-11-10T23:30',
  organizer: 'Blue Note',
  category: 'Música',
  contactEmail: 'jazz@booqi.com',
  contactPhone: '+34600111222',
  imageUrl: '',
}

function firstMessages(values: EventFormValues, mode: 'create' | 'edit' = 'create') {
  const result = eventFormSchema(mode, now).safeParse(values)
  const byField: Record<string, string> = {}
  for (const issue of result.error?.issues ?? []) byField[issue.path.join('.')] ??= issue.message
  return byField
}

describe('eventFormSchema', () => {
  it('converts valid values into a create request', () => {
    expect(eventFormSchema('create', now).parse(valid)).toStrictEqual({
      title: 'Jazz en Madrid',
      availableTickets: 50,
      price: 12.5,
      location: 'IFEMA, Madrid',
      startDate: '2030-11-10T21:00:00',
      endDate: '2030-11-10T23:30:00',
      organizer: 'Blue Note',
      category: 'Música',
      contactEmail: 'jazz@booqi.com',
      contactPhone: '+34600111222',
    })
  })

  it('keeps optional description and image when filled', () => {
    const request = eventFormSchema('create', now).parse({
      ...valid,
      description: 'Noche de jazz',
      imageUrl: 'https://img.booqi.test/jazz.jpg',
    })

    expect(request).toMatchObject({
      description: 'Noche de jazz',
      imageUrl: 'https://img.booqi.test/jazz.jpg',
    })
  })

  it.each([
    ['Ja', 'El título debe tener entre 3 y 200 caracteres'],
    ['J'.repeat(201), 'El título debe tener entre 3 y 200 caracteres'],
    ['', 'El título es obligatorio'],
  ])('rejects title %j', (title, message) => {
    expect(firstMessages({ ...valid, title })).toEqual({ title: message })
  })

  it.each(['Jaz', 'J'.repeat(200)])('accepts title %j', (title) => {
    expect(firstMessages({ ...valid, title })).toEqual({})
  })

  it('limits the description to 2000 characters', () => {
    expect(firstMessages({ ...valid, description: 'a'.repeat(2000) })).toEqual({})
    expect(firstMessages({ ...valid, description: 'a'.repeat(2001) })).toEqual({
      description: 'La descripción no puede exceder 2000 caracteres',
    })
  })

  it.each([
    ['-1', 'El número de tickets no puede ser negativo'],
    ['1.5', 'Indica un número entero de entradas'],
    ['', 'Indica un número entero de entradas'],
  ])('rejects tickets %j', (availableTickets, message) => {
    expect(firstMessages({ ...valid, availableTickets })).toEqual({ availableTickets: message })
  })

  it('accepts 0 tickets', () => {
    expect(firstMessages({ ...valid, availableTickets: '0' })).toEqual({})
  })

  it.each([
    ['-0.01', 'El precio no puede ser negativo'],
    ['', 'Indica un precio'],
    ['abc', 'Indica un precio'],
    ['12.5abc', 'Indica un precio'],
    ['abc12.5', 'Indica un precio'],
  ])('rejects price %j', (price, message) => {
    expect(firstMessages({ ...valid, price })).toEqual({ price: message })
  })

  it('accepts a free event', () => {
    expect(eventFormSchema('create', now).parse({ ...valid, price: '0' }).price).toBe(0)
  })

  it.each([
    ['location', 'IF', 'La ubicación debe tener entre 3 y 200 caracteres'],
    ['organizer', 'BN', 'El organizador debe tener entre 3 y 100 caracteres'],
    ['organizer', 'B'.repeat(101), 'El organizador debe tener entre 3 y 100 caracteres'],
    ['contactEmail', 'jazz@', 'El email de contacto debe ser válido'],
    ['contactPhone', '12345678', 'El teléfono debe tener entre 9 y 15 dígitos'],
    ['contactPhone', '', 'El teléfono de contacto es obligatorio'],
    ['category', 'Cine', 'Elige una categoría'],
    ['imageUrl', 'no es una url', 'La URL de la imagen debe ser válida'],
  ] as const)('rejects %s %j', (field, value, message) => {
    expect(firstMessages({ ...valid, [field]: value })).toEqual({ [field]: message })
  })

  it.each(['https://img.booqi.test/a.png', 'img.booqi.test/a.png', 'http://cdn.booqi.com:8080/x'])(
    'accepts image URL %j',
    (imageUrl) => {
      expect(firstMessages({ ...valid, imageUrl })).toEqual({})
    },
  )

  it('requires a future start date on create', () => {
    expect(
      firstMessages({ ...valid, startDate: '2030-06-15T09:59', endDate: '2030-06-16T10:00' }),
    ).toEqual({
      startDate: 'La fecha de inicio debe ser en el futuro',
    })
  })

  it('accepts a past start date on edit', () => {
    expect(
      firstMessages(
        { ...valid, startDate: '2020-01-01T10:00', endDate: '2020-01-01T12:00' },
        'edit',
      ),
    ).toEqual({})
  })

  it('rejects an end date before the start date', () => {
    expect(firstMessages({ ...valid, endDate: '2030-11-10T20:59' })).toEqual({
      endDate: 'La fecha de fin no puede ser anterior a la de inicio',
    })
  })

  it('accepts an end date equal to the start date', () => {
    expect(firstMessages({ ...valid, endDate: valid.startDate })).toEqual({})
  })

  it.each([
    ['startDate', '', 'La fecha de inicio es obligatoria'],
    ['endDate', '', 'La fecha de fin es obligatoria'],
  ] as const)('requires %s', (field, value, message) => {
    expect(firstMessages({ ...valid, [field]: value })[field]).toBe(message)
  })

  it('trims text and number fields', () => {
    const request = eventFormSchema('create', now).parse({
      ...valid,
      title: '  Jazz en Madrid  ',
      description: '  Noche  ',
      availableTickets: ' 50 ',
      price: ' 12.5 ',
      location: ' IFEMA, Madrid ',
      organizer: ' Blue Note ',
      contactEmail: ' jazz@booqi.com ',
      contactPhone: ' +34600111222 ',
      imageUrl: ' img.booqi.test/a.png ',
    })

    expect(request).toMatchObject({
      title: 'Jazz en Madrid',
      description: 'Noche',
      availableTickets: 50,
      price: 12.5,
      location: 'IFEMA, Madrid',
      organizer: 'Blue Note',
      contactEmail: 'jazz@booqi.com',
      contactPhone: '+34600111222',
      imageUrl: 'img.booqi.test/a.png',
    })
  })

  it.each([
    ['location', 'La ubicación es obligatoria'],
    ['organizer', 'El organizador es obligatorio'],
  ] as const)('requires %s', (field, message) => {
    expect(firstMessages({ ...valid, [field]: '' })).toEqual({ [field]: message })
  })

  it('rejects a start date equal to now on create', () => {
    expect(
      firstMessages({ ...valid, startDate: '2030-06-15T10:00', endDate: '2030-06-15T12:00' }),
    ).toEqual({
      startDate: 'La fecha de inicio debe ser en el futuro',
    })
  })

  it('reports the date rules as custom issues', () => {
    const issues =
      eventFormSchema('create', now).safeParse({
        ...valid,
        startDate: '2030-06-15T09:00',
        endDate: '2030-06-15T08:00',
      }).error?.issues ?? []

    expect(issues.map((issue) => [issue.path.join('.'), issue.code])).toEqual([
      ['startDate', 'custom'],
      ['endDate', 'custom'],
    ])
  })

  it.each(['x2030-11-10T21:00', '2030-11-10T21:00:00', '2030-11-10'])(
    'rejects start date %j',
    (startDate) => {
      expect(firstMessages({ ...valid, startDate }).startDate).toBe(
        'La fecha de inicio es obligatoria',
      )
    },
  )

  it.each(['600111222', '+346001112223'])('accepts phone %j', (contactPhone) => {
    expect(firstMessages({ ...valid, contactPhone })).toEqual({})
  })

  it.each(['x600111222', '1234567890123456', '+34 600111222'])(
    'rejects phone %j',
    (contactPhone) => {
      expect(firstMessages({ ...valid, contactPhone }).contactPhone).toBe(
        'El teléfono debe tener entre 9 y 15 dígitos',
      )
    },
  )

  it.each(['img.booqi.test', 'https://img.booqi.test'])(
    'accepts image URL without path %j',
    (imageUrl) => {
      expect(firstMessages({ ...valid, imageUrl })).toEqual({})
    },
  )

  it.each(['¿img.booqi.test', 'img.booqi.test x', 'https://img'])(
    'rejects image URL %j',
    (imageUrl) => {
      expect(firstMessages({ ...valid, imageUrl }).imageUrl).toBe(
        'La URL de la imagen debe ser válida',
      )
    },
  )

  it('uses the current date by default', () => {
    const past = { ...valid, startDate: '2000-01-01T10:00', endDate: '2000-01-01T12:00' }

    expect(eventFormSchema('create').safeParse(past).success).toBe(false)
    expect(eventFormSchema('edit').safeParse(past).success).toBe(true)
  })
})

describe('eventToFormValues', () => {
  it('fills the form from an event', () => {
    expect(eventToFormValues({ ...jazzEvent, description: null, imageUrl: null })).toEqual({
      title: 'Jazz en Madrid',
      description: '',
      availableTickets: '50',
      price: '12.5',
      location: 'IFEMA, Madrid',
      startDate: '2030-11-10T21:00',
      endDate: '2030-11-10T23:30',
      organizer: 'Blue Note Madrid',
      category: 'Música',
      contactEmail: 'jazz@booqi.com',
      contactPhone: '+34600111222',
      imageUrl: '',
    })
  })

  it('keeps description and image', () => {
    expect(eventToFormValues(jazzEvent)).toMatchObject({
      description: jazzEvent.description,
      imageUrl: jazzEvent.imageUrl,
    })
  })
})

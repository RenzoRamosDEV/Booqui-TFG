export const EVENT_CATEGORIES = [
  'Música',
  'Arte',
  'Deporte',
  'Gastronomía',
  'Tecnología',
  'Educación',
  'Otros',
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]

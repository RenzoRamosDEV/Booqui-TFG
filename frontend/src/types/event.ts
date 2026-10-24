export type EventResponse = {
  id: number
  title: string
  description: string | null
  availableTickets: number
  location: string
  startDate: string
  endDate: string
  organizer: string
  price: number
  category: string
  contactEmail: string
  contactPhone: string
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export type CreateEventRequest = {
  title: string
  description?: string
  availableTickets: number
  location: string
  startDate: string
  endDate: string
  organizer: string
  price: number
  category: string
  contactEmail: string
  contactPhone: string
  imageUrl?: string
}

export type UpdateEventRequest = Partial<CreateEventRequest>

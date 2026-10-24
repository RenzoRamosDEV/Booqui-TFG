export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export type BookingResponse = {
  id: number
  userId: number
  userFirstName: string
  userLastName: string
  userEmail: string
  eventId: number
  eventTitle: string
  eventDescription: string | null
  eventStartDate: string
  eventLocation: string
  ticketQuantity: number
  basePrice: number
  totalPrice: number
  status: BookingStatus
  createdAt: string
  updatedAt: string
}

export type CreateBookingRequest = {
  userId: number
  eventId: number
  ticketQuantity: number
}

import { create } from 'zustand'
import { toCents } from '../../../lib/money'
import type { EventResponse } from '../../../types/event'

export const MAX_TICKETS_PER_LINE = 10

export type CartLine = { event: EventResponse; quantity: number }

type CartState = {
  lines: CartLine[]
  add: (event: EventResponse, quantity: number) => void
  setQuantity: (eventId: number, quantity: number) => void
  remove: (eventId: number) => void
  removeMany: (eventIds: number[]) => void
  clear: () => void
}

export function maxQuantity(event: Pick<EventResponse, 'availableTickets'>): number {
  return Math.max(0, Math.min(event.availableTickets, MAX_TICKETS_PER_LINE))
}

function withLine(lines: CartLine[], line: CartLine): CartLine[] {
  const others = lines.filter((current) => current.event.id !== line.event.id)
  if (line.quantity < 1) return others
  const index = lines.findIndex((current) => current.event.id === line.event.id)
  if (index === -1) return [...lines, line]
  return lines.map((current, position) => (position === index ? line : current))
}

function bounded(event: EventResponse, quantity: number): CartLine {
  return { event, quantity: Math.min(quantity, maxQuantity(event)) }
}

export const useCartStore = create<CartState>()((set) => ({
  lines: [],
  add: (event, quantity) =>
    set((state) => {
      if (quantity < 1) return state
      const { lines } = state
      const current = lines.find((line) => line.event.id === event.id)?.quantity ?? 0
      return { lines: withLine(lines, bounded(event, current + quantity)) }
    }),
  setQuantity: (eventId, quantity) =>
    set((state) => {
      const line = state.lines.find((current) => current.event.id === eventId)
      if (!line) return state
      return { lines: withLine(state.lines, bounded(line.event, quantity)) }
    }),
  remove: (eventId) =>
    set(({ lines }) => ({ lines: lines.filter((line) => line.event.id !== eventId) })),
  removeMany: (eventIds) =>
    set(({ lines }) => ({ lines: lines.filter((line) => !eventIds.includes(line.event.id)) })),
  clear: () => set({ lines: [] }),
}))

export function lineTotalCents(line: CartLine): number {
  return toCents(line.event.price) * line.quantity
}

export function ticketCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0)
}

export function cartTotalCents(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + lineTotalCents(line), 0)
}

import type { BadgeTone } from '../../../components/ui/Badge'
import { formatEuro, toCents } from '../../../lib/money'

const LOW_STOCK = 10

export type Availability = { label: string; tone: BadgeTone; soldOut: boolean }

export function availability(tickets: number): Availability {
  if (tickets <= 0) return { label: 'Agotado', tone: 'danger', soldOut: true }
  if (tickets === 1) return { label: 'Última entrada', tone: 'warning', soldOut: false }
  if (tickets <= LOW_STOCK) {
    return { label: `Últimas ${tickets} entradas`, tone: 'warning', soldOut: false }
  }
  return { label: `${tickets} entradas disponibles`, tone: 'success', soldOut: false }
}

export function priceLabel(price: number): string {
  return price === 0 ? 'Gratis' : formatEuro(toCents(price))
}

import { toCents } from '../../../lib/money'
import type { EventResponse } from '../../../types/event'
import type { UserResponse } from '../../../types/user'
import { salesTotals, type SalesRow } from './sales'

export type AdminSummary = {
  admins: number
  customers: number
  averagePriceCents: number
  approvedCents: number
}

export function adminSummary(
  users: UserResponse[],
  events: EventResponse[],
  rows: SalesRow[],
): AdminSummary {
  const totalPriceCents = events.reduce((total, event) => total + toCents(event.price), 0)
  return {
    admins: users.filter((user) => user.role === 'ADMIN').length,
    customers: users.filter((user) => user.role === 'CUSTOMER').length,
    averagePriceCents: events.length === 0 ? 0 : Math.round(totalPriceCents / events.length),
    approvedCents: salesTotals(rows).approvedCents,
  }
}

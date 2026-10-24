import { eventWith } from '../../../test/fixtures/events'
import { paymentWith } from '../../../test/fixtures/payments'
import { userWith } from '../../../test/users'
import { adminSummary } from './admin-summary'
import { buildSalesRows } from './sales'

describe('adminSummary', () => {
  const users = [userWith('ADMIN'), userWith('CUSTOMER'), userWith('CUSTOMER')]

  it('counts admins and customers', () => {
    expect(adminSummary(users, [], [])).toMatchObject({ admins: 1, customers: 2 })
  })

  it('averages the event price in cents', () => {
    const events = [eventWith({ price: 10 }), eventWith({ price: 20.01 }), eventWith({ price: 0 })]

    expect(adminSummary(users, events, []).averagePriceCents).toBe(1000)
  })

  it('averages 0 without events', () => {
    expect(adminSummary(users, [], []).averagePriceCents).toBe(0)
  })

  it('adds only approved sales', () => {
    const rows = buildSalesRows(
      [
        paymentWith({ id: 1, totalPrice: 25, status: 'APPROVED' }),
        paymentWith({ id: 2, totalPrice: 30, status: 'REJECTED' }),
      ],
      [],
    )

    expect(adminSummary(users, [], rows).approvedCents).toBe(2500)
  })
})

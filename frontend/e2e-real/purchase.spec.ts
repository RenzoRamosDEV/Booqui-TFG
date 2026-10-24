import { expect, test } from '@playwright/test'
import {
  bookingsOf,
  createCustomer,
  createEvent,
  getBooking,
  getEvent,
  type Customer,
  type RealEvent,
} from './support/backend'
import { buyTickets, logInAs, payWithCard } from './support/flows'

let customer: Customer
let event: RealEvent

test.beforeAll(async ({ request }) => {
  customer = await createCustomer(request)
  event = await createEvent(request)
})

test.beforeEach(async ({ page }) => {
  await logInAs(page, customer.contactEmail, customer.password)
})

test('an approved card confirms the booking and decreases the stock', async ({ page, request }) => {
  const stockBefore = (await getEvent(request, event.id)).availableTickets

  await buyTickets(page, event, 2)
  await payWithCard(page, '4242 4242 4242 4242')

  await expect(page.getByRole('heading', { name: '¡Pago completado!' })).toBeVisible()
  const [booking] = await bookingsOf(request, customer.id)
  const result = page.getByRole('listitem', { name: event.title })
  await expect(result.getByText(String(booking!.id), { exact: true })).toBeVisible()
  await expect(
    result.getByRole('img', { name: `Código QR de la reserva ${booking!.id}` }),
  ).toBeVisible()
  expect((await getBooking(request, booking!.id)).status).toBe('CONFIRMED')
  expect((await getEvent(request, event.id)).availableTickets).toBe(stockBefore - 2)
})

test('a card ending in an odd digit cancels the booking and keeps the stock', async ({
  page,
  request,
}) => {
  const stockBefore = (await getEvent(request, event.id)).availableTickets
  const knownIds = new Set((await bookingsOf(request, customer.id)).map(({ id }) => id))

  await buyTickets(page, event, 1)
  await payWithCard(page, '4111 1111 1111 1111')

  const result = page.getByRole('listitem', { name: event.title })
  await expect(result).toContainText('Pago rechazado')
  await expect(result).toContainText('Payment rejected by simulation')
  const created = (await bookingsOf(request, customer.id)).filter(({ id }) => !knownIds.has(id))
  expect(created).toHaveLength(1)
  expect((await getBooking(request, created[0]!.id)).status).toBe('CANCELLED')
  expect((await getEvent(request, event.id)).availableTickets).toBe(stockBefore)
})

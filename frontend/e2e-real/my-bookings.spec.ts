import { expect, test } from '@playwright/test'
import {
  bookingsOf,
  createCustomer,
  createEvent,
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

test('lists the approved and the rejected booking under the run event', async ({
  page,
  request,
}) => {
  await logInAs(page, customer.contactEmail, customer.password)

  await buyTickets(page, event, 1)
  await payWithCard(page, '4242 4242 4242 4242')
  await expect(page.getByRole('heading', { name: '¡Pago completado!' })).toBeVisible()
  await buyTickets(page, event, 1)
  await payWithCard(page, '4111 1111 1111 1111')
  await expect(page.getByRole('listitem', { name: event.title })).toContainText('Pago rechazado')

  const bookings = await bookingsOf(request, customer.id)
  const confirmed = bookings.find(({ status }) => status === 'CONFIRMED')!
  const cancelled = bookings.find(({ status }) => status === 'CANCELLED')!
  await page.goto('/my-bookings')

  const group = page.getByRole('article', { name: event.title })
  await expect(group).toHaveCount(1)
  await expect(group.getByRole('listitem', { name: /^Reserva / })).toHaveCount(2)
  await expect(
    group.getByRole('listitem', { name: `Reserva ${cancelled.id}` }).getByText('Cancelada'),
  ).toBeVisible()

  await page.getByRole('button', { name: `Ver detalle de la reserva ${confirmed.id}` }).click()
  const drawer = page.getByRole('dialog', { name: event.title })
  await expect(drawer.getByText(String(confirmed.id), { exact: true })).toBeVisible()
  await expect(
    drawer.getByRole('img', { name: `Código QR de la reserva ${confirmed.id}` }),
  ).toBeVisible()
})

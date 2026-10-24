import { expect, test } from '@playwright/test'
import { jazzBooking } from '../src/test/fixtures/bookings'
import { customer, defaultState, mockApi, signInAs } from './support/mock-api'

function seeded() {
  const state = defaultState()
  state.bookings = [
    {
      ...jazzBooking,
      id: 42,
      userId: customer.id,
      ticketQuantity: 2,
      totalPrice: 25,
      status: 'CONFIRMED',
    },
    {
      ...jazzBooking,
      id: 43,
      userId: customer.id,
      ticketQuantity: 1,
      totalPrice: 12.5,
      status: 'PENDING',
    },
    {
      ...jazzBooking,
      id: 50,
      userId: customer.id,
      eventId: 7,
      eventTitle: 'Rock en Madrid',
      eventStartDate: '2030-12-01T20:00:00',
      status: 'CONFIRMED',
    },
    { ...jazzBooking, id: 60, userId: 999, status: 'CONFIRMED' },
  ]
  return state
}

test('lists the bookings grouped by event, newest event first', async ({ page }) => {
  await signInAs(page, customer)
  await mockApi(page, seeded())
  await page.goto('/my-bookings')

  const groups = page.getByRole('article')
  await expect(groups).toHaveCount(2)
  await expect(groups.nth(0)).toHaveAccessibleName('Rock en Madrid')
  await expect(groups.nth(1)).toHaveAccessibleName('Jazz en Madrid')
  await expect(page.getByRole('listitem', { name: /^Reserva / })).toHaveCount(3)
  await expect(page.getByRole('listitem', { name: 'Reserva 60' })).toHaveCount(0)
})

test('opens the detail of a booking with its code and QR', async ({ page }) => {
  await signInAs(page, customer)
  await mockApi(page, seeded())
  await page.goto('/my-bookings')

  await page.getByRole('button', { name: 'Ver detalle de la reserva 42' }).click()

  const drawer = page.getByRole('dialog', { name: 'Jazz en Madrid' })
  await expect(drawer.getByText('42', { exact: true })).toBeVisible()
  await expect(drawer.getByRole('img', { name: 'Código QR de la reserva 42' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
})

test('cancels a booking through the confirmation dialog', async ({ page }) => {
  await signInAs(page, customer)
  const state = await mockApi(page, seeded())
  await page.goto('/my-bookings')

  await page.getByRole('button', { name: 'Cancelar reserva 43' }).click()
  await page
    .getByRole('dialog', { name: '¿Cancelar la reserva?' })
    .getByRole('button', { name: 'Sí, cancelar' })
    .click()

  const row = page.getByRole('listitem', { name: 'Reserva 43' })
  await expect(row.getByText('Cancelada')).toBeVisible()
  await expect(row.getByRole('button', { name: 'Cancelar reserva 43' })).toHaveCount(0)
  expect(state.bookings.find((booking) => booking.id === 43)!.status).toBe('CANCELLED')
})

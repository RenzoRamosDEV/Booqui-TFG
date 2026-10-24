import { expect, test, type Page } from '@playwright/test'
import { customer, defaultState, mockApi, signInAs } from './support/mock-api'

async function buyJazz(page: Page, quantity: number) {
  await page.goto('/events')
  await page.getByRole('link', { name: 'Jazz en Madrid' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Jazz en Madrid' })).toBeVisible()
  for (let index = 1; index < quantity; index += 1) {
    await page.getByRole('button', { name: 'Añadir una entrada' }).click()
  }
  await page.getByRole('button', { name: 'Añadir al carrito' }).click()
  await page
    .getByRole('banner')
    .getByRole('link', { name: /carrito/i })
    .click()
  await expect(page).toHaveURL('/cart')
  await page.getByRole('button', { name: 'Ir al pago' }).click()
  await expect(page).toHaveURL('/checkout')
  await page.getByRole('button', { name: 'Continuar al pago' }).click()
}

async function payWithCard(page: Page, cardNumber: string) {
  await page.getByLabel('Titular de la tarjeta').fill('Mel García')
  await page.getByLabel('Número de tarjeta').fill(cardNumber)
  await page.getByLabel('Caducidad (MM/AA)').fill('12/35')
  await page.getByLabel('CVV').fill('123')
  await page.getByRole('button', { name: /^Pagar/ }).click()
}

test('a customer buys two tickets and gets the booking code and QR', async ({ page }) => {
  await signInAs(page, customer)
  const state = await mockApi(page)

  await buyJazz(page, 2)
  await payWithCard(page, '4242 4242 4242 4242')

  await expect(page.getByRole('heading', { name: '¡Pago completado!' })).toBeVisible()
  const result = page.getByRole('listitem', { name: 'Jazz en Madrid' })
  const bookingId = state.bookings[0]!.id
  await expect(result.getByText(String(bookingId), { exact: true })).toBeVisible()
  await expect(
    result.getByRole('img', { name: `Código QR de la reserva ${bookingId}` }),
  ).toBeVisible()
  await expect(result.getByRole('button', { name: 'Descargar entradas' })).toBeEnabled()
  expect(state.payments[0]).toMatchObject({ totalPrice: 25, status: 'APPROVED' })
})

test('the ticket PDF downloads from the confirmation', async ({ page }) => {
  await signInAs(page, customer)
  await mockApi(page)
  await buyJazz(page, 1)
  await payWithCard(page, '4242 4242 4242 4242')

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar entradas' }).click()

  expect((await download).suggestedFilename()).toMatch(/^booqi-jazz-en-madrid-\d+\.pdf$/)
})

test('a card ending in an odd digit is rejected and the booking ends cancelled', async ({
  page,
}) => {
  await signInAs(page, customer)
  const state = await mockApi(page)

  await buyJazz(page, 1)
  await payWithCard(page, '4111 1111 1111 1111')

  const result = page.getByRole('listitem', { name: 'Jazz en Madrid' })
  await expect(result).toContainText('Pago rechazado')
  await expect(result).toContainText('Payment rejected by simulation')
  await expect(page.getByTestId('success-burst')).toHaveCount(0)
  expect(state.bookings[0]!.status).toBe('CANCELLED')
})

test('the rejected booking is listed as cancelled in my bookings', async ({ page }) => {
  await signInAs(page, customer)
  await mockApi(page)

  await buyJazz(page, 1)
  await payWithCard(page, '4111 1111 1111 1111')
  await expect(page.getByRole('listitem', { name: 'Jazz en Madrid' })).toContainText(
    'Pago rechazado',
  )

  await page.goto('/my-bookings')
  await expect(page.getByText('Cancelada').first()).toBeVisible()
})

test('an event with 2 tickets left caps the selector at 2', async ({ page }) => {
  const state = defaultState()
  state.events[0]!.availableTickets = 2
  await mockApi(page, state)
  await page.goto(`/events/${state.events[0]!.id}`)

  const more = page.getByRole('button', { name: 'Añadir una entrada' })
  await more.click()
  await expect(more).toBeDisabled()
  await expect(page.getByRole('status', { name: 'Entradas seleccionadas' })).toHaveText('2')
})

for (const width of [360, 768, 1024, 1440]) {
  test(`no horizontal scroll on the purchase screens at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await signInAs(page, customer)
    const state = await mockApi(page)
    for (const path of ['/events', `/events/${state.events[0]!.id}`]) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    }
    await page.getByRole('button', { name: 'Añadir al carrito' }).click()
    await page
      .getByRole('banner')
      .getByRole('link', { name: /carrito/i })
      .click()
    await expect(page.getByRole('heading', { level: 1, name: 'Tu carrito' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await page.getByRole('button', { name: 'Ir al pago' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Pago' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  })
}

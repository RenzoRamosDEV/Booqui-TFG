import { expect, test } from '@playwright/test'
import { ADMIN, createCustomer, type Customer } from './support/backend'
import { submitLogin } from './support/flows'

let customer: Customer

test.beforeAll(async ({ request }) => {
  customer = await createCustomer(request)
})

test('a wrong password shows the Spanish message and stays on /login', async ({ page }) => {
  await page.goto('/login')

  await submitLogin(page, customer.contactEmail, 'contraseña-incorrecta')

  await expect(page.getByRole('alert')).toHaveText('Email o contraseña incorrectos.')
  await expect(page).toHaveURL('/login')
})

test('the customer follows the redirect to /my-bookings', async ({ page }) => {
  await page.goto('/login?redirect=%2Fmy-bookings')

  await submitLogin(page, customer.contactEmail, customer.password)

  await expect(page).toHaveURL('/my-bookings')
  await expect(page.getByRole('banner').getByText(customer.firstName)).toBeVisible()
})

test('the seeded admin without redirect lands on /admin', async ({ page }) => {
  await page.goto('/login')

  await submitLogin(page, ADMIN.contactEmail, ADMIN.password)

  await expect(page).toHaveURL('/admin')
})

import { expect, test } from '@playwright/test'
import { PASSWORD, admin, customer, mockApi } from './support/mock-api'

async function logIn(page: import('@playwright/test').Page, email: string, password: string) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
}

test('a wrong password shows the Spanish message', async ({ page }) => {
  await mockApi(page)
  await page.goto('/login')

  await logIn(page, customer.contactEmail, 'incorrecta')

  await expect(page.getByRole('alert')).toHaveText('Email o contraseña incorrectos.')
  await expect(page).toHaveURL('/login')
})

test('a valid login follows the redirect', async ({ page }) => {
  await mockApi(page)
  await page.goto('/login?redirect=%2Fmy-bookings')

  await logIn(page, customer.contactEmail, PASSWORD)

  await expect(page).toHaveURL('/my-bookings')
  await expect(page.getByRole('banner').getByText('Mel')).toBeVisible()
})

test('an admin without redirect lands on /admin', async ({ page }) => {
  await mockApi(page)
  await page.goto('/login')

  await logIn(page, admin.contactEmail, PASSWORD)

  await expect(page).toHaveURL('/admin')
})

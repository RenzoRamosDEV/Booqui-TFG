import { expect, type Page } from '@playwright/test'
import type { RealEvent } from './backend'

export async function submitLogin(page: Page, email: string, password: string) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
}

export async function logInAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await submitLogin(page, email, password)
  await expect(page).not.toHaveURL(/\/login/)
}

export async function buyTickets(page: Page, event: RealEvent, quantity: number) {
  await page.goto(`/events/${event.id}`)
  await expect(page.getByRole('heading', { level: 1, name: event.title })).toBeVisible()
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

export async function payWithCard(page: Page, cardNumber: string) {
  await page.getByLabel('Titular de la tarjeta').fill('Ada Prueba')
  await page.getByLabel('Número de tarjeta').fill(cardNumber)
  await page.getByLabel('Caducidad (MM/AA)').fill('12/35')
  await page.getByLabel('CVV').fill('123')
  await page.getByRole('button', { name: /^Pagar/ }).click()
}

import { expect, test, type Page } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { jazzBooking } from '../../src/test/fixtures/bookings'
import { jazzEvent } from '../../src/test/fixtures/events'
import type { BookingResponse } from '../../src/types/booking'
import type { EventResponse } from '../../src/types/event'
import type { PaymentResponse } from '../../src/types/payment'
import {
  admin,
  customer,
  defaultState,
  mockApi,
  signInAs,
  type MockState,
} from '../support/mock-api'

type Theme = 'light' | 'dark'

const SCREENSHOTS_DIR = resolve('../landing/assets/screenshots')
const ASSETS_DIR = resolve('../landing/assets')
const WIDTHS = [640, 1280]
const WEBP_QUALITY = 0.8

const SHOTS: { screen: string; path: string; theme: Theme; signedIn?: boolean }[] = [
  { screen: 'inicio', path: '/', theme: 'light' },
  { screen: 'inicio', path: '/', theme: 'dark' },
  { screen: 'eventos', path: '/events', theme: 'light' },
  { screen: 'evento', path: '/events/4', theme: 'dark' },
  { screen: 'admin', path: '/admin', theme: 'light', signedIn: true },
]

function event(overrides: Partial<EventResponse>): EventResponse {
  return { ...jazzEvent, imageUrl: null, ...overrides }
}

function showcaseState(): MockState {
  const events = [
    event({ id: 4, availableTickets: 48 }),
    event({
      id: 7,
      title: 'Rock en Madrid',
      description: 'Las bandas de la escena independiente en una sola noche.',
      location: 'WiZink Center, Madrid',
      startDate: '2030-12-01T20:00:00',
      endDate: '2030-12-01T23:00:00',
      organizer: 'Live Nation',
      price: 30,
      availableTickets: 120,
    }),
    event({
      id: 9,
      title: 'Ruta de tapas por Sevilla',
      description: 'Ruta gastronómica por los bares históricos del centro.',
      location: 'Plaza Nueva, Sevilla',
      startDate: '2030-10-05T12:00:00',
      endDate: '2030-10-05T16:00:00',
      organizer: 'Sabores del Sur',
      price: 18,
      category: 'Gastronomía',
      availableTickets: 6,
    }),
    event({
      id: 11,
      title: 'Feria de arte contemporáneo',
      description: 'Galerías y artistas emergentes en un recorrido de tres días.',
      location: 'Matadero, Madrid',
      startDate: '2030-09-18T10:00:00',
      endDate: '2030-09-20T20:00:00',
      organizer: 'Arte Vivo',
      price: 9.5,
      category: 'Arte',
      availableTickets: 300,
    }),
    event({
      id: 12,
      title: 'Conferencia de desarrollo web',
      description: 'Charlas sobre React, accesibilidad y rendimiento en la web.',
      location: 'Palau de Congressos, Barcelona',
      startDate: '2030-10-22T09:00:00',
      endDate: '2030-10-22T18:00:00',
      organizer: 'Comunidad Frontend',
      price: 45,
      category: 'Tecnología',
      availableTickets: 80,
    }),
    event({
      id: 13,
      title: 'Media maratón de Valencia',
      description: 'Recorrido urbano de 21 km con salida en la Ciudad de las Artes.',
      location: 'Ciudad de las Artes, Valencia',
      startDate: '2030-10-27T08:30:00',
      endDate: '2030-10-27T12:30:00',
      organizer: 'Valencia Corre',
      price: 25,
      category: 'Deporte',
      availableTickets: 500,
    }),
  ]
  const bookings: BookingResponse[] = [
    { ...jazzBooking, id: 42, ticketQuantity: 2, totalPrice: 25 },
    {
      ...jazzBooking,
      id: 43,
      eventId: 7,
      eventTitle: 'Rock en Madrid',
      eventLocation: 'WiZink Center, Madrid',
      ticketQuantity: 3,
      basePrice: 30,
      totalPrice: 90,
    },
  ]
  const payments: PaymentResponse[] = bookings.map((booking, index) => ({
    id: 900 + index,
    bookingId: booking.id,
    userId: customer.id,
    eventId: booking.eventId,
    ticketQuantity: booking.ticketQuantity,
    totalPrice: booking.totalPrice,
    paymentMethod: 'CREDIT_CARD',
    status: 'APPROVED',
    transactionId: `txn-${booking.id}`,
    errorMessage: null,
    paymentDate: '2030-01-12T10:00:05',
    createdAt: '2030-01-12T10:00:00',
    updatedAt: '2030-01-12T10:00:05',
  }))
  return { ...defaultState(), events, bookings, payments }
}

/** Resizes and re-encodes an image inside Chromium, so no image library is needed. */
async function encode(
  page: Page,
  source: Buffer,
  widths: number[],
  type: string,
  quality?: number,
) {
  const dataUrls = await page.evaluate(
    async ({ base64, widths, type, quality }) => {
      const image = new Image()
      image.src = `data:image/png;base64,${base64}`
      await image.decode()
      return widths.map((width) => {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = Math.round((image.naturalHeight * width) / image.naturalWidth)
        const context = canvas.getContext('2d')!
        context.imageSmoothingQuality = 'high'
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL(type, quality)
      })
    },
    { base64: source.toString('base64'), widths, type, quality },
  )
  return dataUrls.map((dataUrl) => {
    expect(dataUrl.startsWith(`data:${type};base64,`)).toBe(true)
    return Buffer.from(dataUrl.split(',')[1]!, 'base64')
  })
}

test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })

test.beforeAll(() => mkdirSync(SCREENSHOTS_DIR, { recursive: true }))

for (const shot of SHOTS) {
  test(`${shot.screen} (${shot.theme})`, async ({ page }) => {
    await page.route(/^https?:\/\/(?!localhost)/, (route) => route.abort())
    await page.emulateMedia({ colorScheme: shot.theme })
    await page.addInitScript((theme) => localStorage.setItem('booqi-theme', theme), shot.theme)
    await mockApi(page, showcaseState())
    if (shot.signedIn) await signInAs(page, admin)

    await page.goto(shot.path)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('main')).not.toHaveAttribute('aria-busy', 'true')
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
    await page.evaluate(() => document.fonts.ready)

    const png = await page.screenshot()
    const files = await encode(page, png, WIDTHS, 'image/webp', WEBP_QUALITY)
    WIDTHS.forEach((width, index) => {
      writeFileSync(
        resolve(SCREENSHOTS_DIR, `${shot.screen}-${shot.theme}-${width}.webp`),
        files[index]!,
      )
    })
  })
}

test('landing icons from BOOQI2.png', async ({ page }) => {
  await page.goto('about:blank')
  const [icon32, icon192] = await encode(
    page,
    readFileSync(resolve('public/BOOQI2.png')),
    [32, 192],
    'image/png',
  )
  writeFileSync(resolve(ASSETS_DIR, 'icon-32.png'), icon32!)
  writeFileSync(resolve(ASSETS_DIR, 'icon-192.png'), icon192!)
})

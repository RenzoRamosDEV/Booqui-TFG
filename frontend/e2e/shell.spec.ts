import { expect, test, type Page } from '@playwright/test'

const customer = {
  id: 7,
  firstName: 'Mel',
  lastName: 'García',
  dateOfBirth: '1995-04-12',
  contactPhone: null,
  contactEmail: 'mel@booqi.com',
  role: 'CUSTOMER',
  createdAt: '2026-01-10T09:30:00',
  updatedAt: '2026-01-10T09:30:00',
}

async function signInAs(page: Page, user: typeof customer) {
  await page.addInitScript(
    (stored) => {
      localStorage.setItem('booqi-session', stored)
    },
    JSON.stringify({ state: { user }, version: 0 }),
  )
}

test('a protected route without session redirects to login', async ({ page }) => {
  await page.goto('/my-bookings')

  await expect(page).toHaveURL('/login?redirect=%2Fmy-bookings')
  await expect(page).toHaveTitle('Iniciar sesión · Booqi')
})

test('a customer on /admin sees the not-found page and sends no admin writes', async ({ page }) => {
  const writes: string[] = []
  const adminChunks: string[] = []
  page.on('request', (request) => {
    if (/AdminPage[-.]/.test(request.url())) adminChunks.push(request.url())
    if (/POST|PUT|DELETE/.test(request.method()) && request.url().includes('/api/v1/events')) {
      writes.push(`${request.method()} ${request.url()}`)
    }
  })
  await signInAs(page, customer)

  await page.goto('/admin')

  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible()
  await expect(page.getByRole('banner').getByText('Mel')).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect(writes).toEqual([])
  expect(adminChunks).toEqual([])
})

for (const width of [360, 768, 1024, 1440]) {
  test(`no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('main')).toBeVisible()

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBe(width)
  })
}

test('the mobile menu opens a drawer with the navigation links', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')

  await page.getByRole('button', { name: 'Abrir menú' }).click()

  const drawer = page.getByRole('dialog', { name: 'Menú' })
  await expect(drawer.getByRole('link', { name: 'Eventos' })).toBeVisible()
  await expect(drawer.getByRole('link', { name: 'Contacto' })).toBeVisible()
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBe(360)
})

test('Tab then Enter on the skip link focuses main', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('main')).toBeVisible()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('main')).toBeFocused()
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('page transitions change only opacity', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      const samples: string[] = []
      ;(window as unknown as { __transforms: string[] }).__transforms = samples
      new MutationObserver(() => {
        document.querySelectorAll<HTMLElement>('[data-testid="page-transition"]').forEach((el) => {
          samples.push(el.style.transform)
        })
      }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['style'] })
    })

    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Eventos' })
      .click()
    await expect(page).toHaveTitle('Eventos · Booqi')
    await page.waitForTimeout(400)

    const transforms = await page.evaluate(
      () => (window as unknown as { __transforms: string[] }).__transforms,
    )
    expect(transforms.length).toBeGreaterThan(0)
    expect(transforms.filter((value) => value !== '' && value !== 'none')).toEqual([])
  })
})

test.describe('motion allowed', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('page transitions slide vertically', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      const samples: string[] = []
      ;(window as unknown as { __transforms: string[] }).__transforms = samples
      new MutationObserver(() => {
        document.querySelectorAll<HTMLElement>('[data-testid="page-transition"]').forEach((el) => {
          samples.push(el.style.transform)
        })
      }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['style'] })
    })

    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Eventos' })
      .click()
    await expect(page).toHaveTitle('Eventos · Booqi')
    await page.waitForTimeout(600)

    const transforms = await page.evaluate(
      () => (window as unknown as { __transforms: string[] }).__transforms,
    )
    expect(transforms.some((value) => value.includes('translateY'))).toBe(true)
  })
})

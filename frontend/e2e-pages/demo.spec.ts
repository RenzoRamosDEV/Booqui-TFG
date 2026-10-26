import { expect, test, type Page } from '@playwright/test'

/** Records everything that would mean the demo is broken or talking to a server. */
function watch(page: Page) {
  const problems: string[] = []
  // page.url() is still about:blank when the document request fires, so use the configured site.
  const origin = new URL(String(test.info().project.use.baseURL)).origin
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`)
  })
  page.on('requestfailed', (request) => problems.push(`failed ${request.url()}`))
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console ${message.text()}`)
  })
  page.on('pageerror', (error) => problems.push(`pageerror ${error.message}`))
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol === 'data:' || url.protocol === 'blob:') return
    if (url.origin !== origin) problems.push(`foreign ${url.href}`)
    if (url.pathname.includes('/api/')) problems.push(`api ${url.href}`)
    if (!url.pathname.startsWith('/Booqui-TFG/')) problems.push(`outside ${url.href}`)
  })
  return problems
}

test.describe('demo at the root of the Pages site', () => {
  test('home loads under /Booqui-TFG/ with events, the demo badge and no network', async ({
    page,
  }) => {
    const problems = watch(page)
    await page.goto('./')

    await expect(page.getByText('Demo · datos simulados')).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Noche de jazz en el Café Central/ }).first(),
    ).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(problems).toEqual([])
  })

  test('a deep link through the hash router survives a reload', async ({ page }) => {
    const problems = watch(page)
    await page.goto('#/events')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.reload()
    await expect(page).toHaveURL(/\/Booqui-TFG\/#\/events$/)
    await expect(page.getByRole('link', { name: /Ruta de tapas por Triana/ }).first()).toBeVisible()
    expect(problems).toEqual([])
  })

  test('the demo customer logs in with one click and buys a ticket', async ({ page }) => {
    const problems = watch(page)
    await page.goto('#/login')
    await expect(page.getByText('cliente@booqi.demo', { exact: false })).toBeVisible()
    await page.getByRole('button', { name: 'Entrar como cliente demo' }).click()
    await expect(page).not.toHaveURL(/#\/login/)

    await page.goto('#/events')
    await page
      .getByRole('link', { name: /Ruta de tapas por Triana/ })
      .first()
      .click()
    await page.getByRole('button', { name: 'Añadir al carrito' }).click()
    await page.goto('#/cart')
    await page.getByRole('button', { name: 'Ir al pago' }).click()
    await page.getByRole('button', { name: 'Continuar al pago' }).click()
    await page.getByLabel('Titular de la tarjeta').fill('Lucía Martín')
    await page.getByLabel('Número de tarjeta').fill('4242 4242 4242 4242')
    await page.getByLabel('Caducidad (MM/AA)').fill('12/35')
    await page.getByLabel('CVV').fill('123')
    await page.getByRole('button', { name: /^Pagar/ }).click()

    await expect(page.getByRole('heading', { name: '¡Pago completado!' })).toBeVisible()
    await page.goto('#/my-bookings')
    await expect(page.getByText(/Ruta de tapas por Triana/).first()).toBeVisible()
    expect(problems).toEqual([])
  })

  test('the demo admin logs in with one click and reaches the panel', async ({ page }) => {
    const problems = watch(page)
    await page.goto('#/login')
    await page.getByRole('button', { name: 'Entrar como admin demo' }).click()
    await expect(page).toHaveURL(/#\/admin$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(problems).toEqual([])
  })
})

test.describe('old /demo/ links', () => {
  test('redirect to the same hash route at the root', async ({ page }) => {
    const problems = watch(page)
    await page.goto('demo/#/events')
    await expect(page).toHaveURL(/\/Booqui-TFG\/#\/events$/)
    await expect(page.getByRole('link', { name: /Ruta de tapas por Triana/ }).first()).toBeVisible()
    expect(problems).toEqual([])
  })

  test('redirect to the root without a hash', async ({ page }) => {
    await page.goto('demo/')
    await expect(page).toHaveURL(/\/Booqui-TFG\/$/)
    await expect(page.getByText('Demo · datos simulados')).toBeVisible()
  })

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    test('refresh to the root', async ({ page }) => {
      await page.goto('demo/')
      await expect(page).toHaveURL(/\/Booqui-TFG\/$/)
    })
  })

  test('keep a plain link to the root as a fallback', async ({ request }) => {
    const html = await (await request.get('demo/')).text()
    expect(html).toContain('<a href="../">')
  })
})

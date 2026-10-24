import { expect, test } from '@playwright/test'

test('home page loads', async ({ page }) => {
  const response = await page.goto('/')

  expect(response?.status()).toBe(200)
  await expect(page.locator('#root')).not.toBeEmpty()
})

test('the home page does not download the PDF or QR libraries', async ({ page }) => {
  const heavy: string[] = []
  page.on('request', (request) => {
    if (/\/assets\/(pdf-lib|qrcode)-/.test(request.url())) heavy.push(request.url())
  })
  await page.route('**/api/v1/**', (route) => route.fulfill({ json: [] }))

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.waitForLoadState('networkidle')

  expect(heavy).toEqual([])
})

test('the entry chunk does not contain the PDF library', async ({ page }) => {
  await page.goto('/')
  const scripts = await page.evaluate(async () => {
    const entry = document.querySelector<HTMLScriptElement>('script[type="module"]')!.src
    return (await fetch(entry)).text()
  })

  expect(scripts).not.toContain('PDFDocument')
})

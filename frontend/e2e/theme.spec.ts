import { expect, test } from '@playwright/test'

test.describe('theme before first paint', () => {
  test.use({ colorScheme: 'light' })

  test('stored dark theme paints the dark background on a light OS', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('booqi-theme', 'dark')
      document.addEventListener('DOMContentLoaded', () => {
        ;(window as unknown as { __bg: string }).__bg = getComputedStyle(
          document.body,
        ).backgroundColor
      })
    })

    await page.goto('/')

    const bg = await page.evaluate(() => (window as unknown as { __bg: string }).__bg)
    expect(bg).toBe('rgb(21, 19, 26)')
  })
})

test('fonts are self-hosted', async ({ page, baseURL }) => {
  const fontUrls: string[] = []
  const thirdParty: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (/fonts\.(googleapis|gstatic)\.com/.test(url)) thirdParty.push(url)
    if (request.resourceType() === 'font') fontUrls.push(url)
  })

  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  expect(thirdParty).toEqual([])
  expect(fontUrls.length).toBeGreaterThan(0)
  for (const url of fontUrls) expect(url.startsWith(baseURL!)).toBe(true)
})

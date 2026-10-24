import { expect, test } from '@playwright/test'
import { scrollToBottom, targets } from './support/landing'

for (const target of targets) {
  test(`every asset loads from the landing itself (${target.name})`, async ({ page }) => {
    const failed: string[] = []
    const errorResponses: string[] = []
    const consoleErrors: string[] = []
    const requested: string[] = []
    const fonts: string[] = []
    page.on('requestfailed', (request) =>
      failed.push(`${request.url()} ${request.failure()?.errorText ?? ''}`),
    )
    page.on('response', (response) => {
      if (response.status() >= 400) errorResponses.push(`${response.status()} ${response.url()}`)
    })
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => consoleErrors.push(error.message))
    page.on('request', (request) => {
      requested.push(request.url())
      if (request.resourceType() === 'font') fonts.push(request.url())
    })

    await page.goto(target.url)
    await scrollToBottom(page)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete))

    expect(failed).toEqual([])
    expect(errorResponses).toEqual([])
    expect(consoleErrors).toEqual([])
    expect(fonts.length).toBeGreaterThan(0)
    const fontsDir = new URL('assets/fonts/', page.url()).href
    for (const font of fonts) {
      expect(font.startsWith(fontsDir)).toBe(true)
      expect(font.endsWith('.woff2')).toBe(true)
    }
    const origin = new URL(page.url())
    const foreign = requested
      .map((url) => new URL(url))
      .filter((url) => url.protocol !== 'data:')
      .filter((url) => url.protocol !== origin.protocol || url.host !== origin.host)
      .map((url) => url.href)
    expect(foreign).toEqual([])
  })
}

import { expect, test, type Page } from '@playwright/test'
import { targets } from './support/landing'

const DARK_BG = 'rgb(21, 19, 26)'
const LIGHT_BG = 'rgb(255, 255, 255)'

const isDark = (page: Page) =>
  page.evaluate(() => document.documentElement.classList.contains('dark'))

const storedTheme = (page: Page) => page.evaluate(() => localStorage.getItem('booqi-theme'))

const toggle = (page: Page) => page.getByRole('button', { name: /^Cambiar a tema/ })

async function storeTheme(page: Page, value: string) {
  await page.addInitScript((theme) => localStorage.setItem('booqi-theme', theme), value)
}

for (const target of targets) {
  test.describe(`theme (${target.name})`, () => {
    test.describe('on a light OS', () => {
      test.use({ colorScheme: 'light' })

      test('stored dark paints the dark background before DOMContentLoaded handlers run', async ({
        page,
      }) => {
        await storeTheme(page, 'dark')
        await page.addInitScript(() => {
          document.addEventListener('DOMContentLoaded', () => {
            document.documentElement.dataset.bgAtReady = getComputedStyle(
              document.body,
            ).backgroundColor
          })
        })
        await page.goto(target.url)
        await expect(page.locator('html')).toHaveAttribute('data-bg-at-ready', DARK_BG)
      })

      test('no stored choice follows the OS and paints the light background', async ({ page }) => {
        await page.goto(target.url)
        expect(await isDark(page)).toBe(false)
        await expect(page.locator('body')).toHaveCSS('background-color', LIGHT_BG)
      })

      test('an unknown stored value counts as no choice', async ({ page }) => {
        await storeTheme(page, 'purple')
        await page.goto(target.url)
        expect(await isDark(page)).toBe(false)
      })

      test('the toggle switches to dark, stores it and exposes the pressed state', async ({
        page,
      }) => {
        await page.goto(target.url)
        await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
        await expect(toggle(page)).toHaveAccessibleName('Cambiar a tema oscuro')

        await toggle(page).click()

        expect(await isDark(page)).toBe(true)
        expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe('dark')
        expect(await storedTheme(page)).toBe('dark')
        await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
        await expect(toggle(page)).toHaveAccessibleName('Cambiar a tema claro')
        await expect(page.locator('body')).toHaveCSS('background-color', DARK_BG)

        await toggle(page).click()

        expect(await isDark(page)).toBe(false)
        expect(await storedTheme(page)).toBe('light')
        await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
      })

      test('the chosen theme survives a reload', async ({ page }) => {
        await page.goto(target.url)
        await toggle(page).click()
        await page.reload()
        expect(await isDark(page)).toBe(true)
        await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
      })

      test('with storage throwing, the page loads cleanly and the toggle still works', async ({
        page,
      }) => {
        const errors: string[] = []
        page.on('pageerror', (error) => errors.push(error.message))
        await page.addInitScript(() => {
          const fail = () => {
            throw new DOMException('blocked', 'SecurityError')
          }
          Storage.prototype.getItem = fail
          Storage.prototype.setItem = fail
        })
        await page.goto(target.url)
        expect(await isDark(page)).toBe(false)

        await toggle(page).click()
        expect(await isDark(page)).toBe(true)
        await toggle(page).click()
        expect(await isDark(page)).toBe(false)
        expect(errors).toEqual([])
      })
    })

    test.describe('on a dark OS', () => {
      test.use({ colorScheme: 'dark' })

      test('no stored choice follows the OS', async ({ page }) => {
        await page.goto(target.url)
        expect(await isDark(page)).toBe(true)
        await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
      })

      test('a stored light choice wins over the OS', async ({ page }) => {
        await storeTheme(page, 'light')
        await page.goto(target.url)
        expect(await isDark(page)).toBe(false)
      })
    })
  })
}

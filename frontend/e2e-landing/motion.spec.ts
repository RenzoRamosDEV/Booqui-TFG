import { expect, test, type Locator, type Page } from '@playwright/test'
import { targets } from './support/landing'

const FINAL_COUNTERS = ['4', '6', '1', '0']

const opacity = (locator: Locator) =>
  locator.evaluate((element) => Number(getComputedStyle(element).opacity))

const counters = (page: Page) => page.locator('[data-counter]')

const lastReveal = (page: Page) => page.locator('.reveal').last()

async function scrollToTop(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0))
}

async function isBelowTheFold(locator: Locator) {
  return locator.evaluate((element) => element.getBoundingClientRect().top > window.innerHeight)
}

for (const target of targets) {
  test.describe(`motion (${target.name})`, () => {
    test.describe('with motion allowed', () => {
      test.use({ reducedMotion: 'no-preference' })

      test('a reveal block below the fold fades in on scroll and stays visible', async ({
        page,
      }) => {
        await page.goto(target.url)
        const reveal = lastReveal(page)
        expect(await isBelowTheFold(reveal)).toBe(true)
        expect(await opacity(reveal)).toBeLessThan(1)

        await reveal.scrollIntoViewIfNeeded()
        await expect.poll(() => opacity(reveal)).toBe(1)

        await scrollToTop(page)
        expect(await opacity(reveal)).toBe(1)
      })

      test('counters reach their final values and do not restart on re-entry', async ({ page }) => {
        await page.goto(target.url)
        await counters(page).first().scrollIntoViewIfNeeded()
        await expect(counters(page).first()).not.toHaveText('4')
        await expect(counters(page)).toHaveText(FINAL_COUNTERS)

        await scrollToTop(page)
        const sampled = await counters(page)
          .first()
          .evaluate(async (first) => {
            first.scrollIntoView()
            await new Promise(requestAnimationFrame)
            await new Promise(requestAnimationFrame)
            return Array.from(document.querySelectorAll('[data-counter]'), (c) => c.textContent)
          })
        expect(sampled).toEqual(FINAL_COUNTERS)
      })

      test('counters start from zero when they first appear', async ({ page }) => {
        await page.goto(target.url)
        const seen = await counters(page)
          .first()
          .evaluate(async (counter) => {
            const values = new Set<string>()
            const record = () => values.add(counter.textContent ?? '')
            const observer = new MutationObserver(record)
            observer.observe(counter, { childList: true, characterData: true, subtree: true })
            counter.scrollIntoView()
            await new Promise((done) => setTimeout(done, 2000))
            observer.disconnect()
            record()
            return Array.from(values)
          })
        expect(seen).toContain('0')
        expect(seen.at(-1)).toBe('4')
      })
    })

    test.describe('with reduced motion', () => {
      test.use({ reducedMotion: 'reduce' })

      test('reveal blocks are visible on load', async ({ page }) => {
        await page.goto(target.url)
        const opacities = await page
          .locator('.reveal')
          .evaluateAll((elements) => elements.map((e) => Number(getComputedStyle(e).opacity)))
        expect(opacities.length).toBeGreaterThan(0)
        expect(opacities.every((value) => value === 1)).toBe(true)
      })

      test('counters show their final values without counting', async ({ page }) => {
        await page.goto(target.url)
        const sampled = await counters(page)
          .first()
          .evaluate(async (first) => {
            first.scrollIntoView()
            await new Promise((done) => setTimeout(done, 50))
            return Array.from(document.querySelectorAll('[data-counter]'), (c) => c.textContent)
          })
        expect(sampled).toEqual(FINAL_COUNTERS)
      })

      test('no infinite animation runs', async ({ page }) => {
        await page.goto(target.url)
        const infinite = await page.evaluate(() =>
          document
            .getAnimations()
            .filter((animation) => animation.effect?.getComputedTiming().iterations === Infinity)
            .map((animation) => (animation as CSSAnimation).animationName ?? 'unknown'),
        )
        expect(infinite).toEqual([])
      })
    })

    test.describe('without JavaScript', () => {
      test.use({ javaScriptEnabled: false, reducedMotion: 'no-preference' })

      test('every reveal block is visible and counters show final values', async ({ page }) => {
        await page.goto(target.url)
        const opacities = await page
          .locator('.reveal')
          .evaluateAll((elements) => elements.map((e) => Number(getComputedStyle(e).opacity)))
        expect(opacities.length).toBeGreaterThan(0)
        expect(opacities.every((value) => value === 1)).toBe(true)
        await expect(counters(page)).toHaveText(FINAL_COUNTERS)
      })
    })
  })
}

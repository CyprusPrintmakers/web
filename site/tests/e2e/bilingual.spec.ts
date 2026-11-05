import { expect, test } from '@playwright/test'

const GREEK_PAGES = ['/el', '/el/about', '/el/contact', '/el/members', '/el/membership', '/el/privacy', '/el/projects']

test.describe('greek overflow at 320px', () => {
  for (const url of GREEK_PAGES) {
    test(`no horizontal overflow on ${url}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 })
      await page.goto(url)

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)
    })
  }
})

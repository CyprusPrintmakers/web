import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = ['/', '/about', '/members', '/projects', '/news', '/membership']

test.describe('accessibility', () => {
  for (const path of PAGES) {
    test(`axe finds no wcag2a/aa violations on ${path}`, async ({ page }) => {
      await page.goto(path)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(results.violations).toEqual([])
    })

    test(`axe finds no wcag2a/aa violations on /el${path === '/' ? '' : path}`, async ({
      page,
    }) => {
      await page.goto(`/el${path === '/' ? '' : path}`)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(results.violations).toEqual([])
    })
  }

  test('every page has a lang, every image an alt, every control a label', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path)

      expect(await page.locator('html').getAttribute('lang')).toBeTruthy()

      const images = await page.locator('img').all()
      for (const image of images) {
        expect(await image.getAttribute('alt')).not.toBeNull()
      }

      const controls = await page
        .locator('main input:not([type="hidden"]), main select, main textarea')
        .all()
      for (const control of controls) {
        const id = await control.getAttribute('id')
        if (!id) continue
        expect(await page.locator(`label[for="${id}"]`).count()).toBeGreaterThan(0)
      }
    }
  })
})

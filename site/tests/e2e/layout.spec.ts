import { expect, test } from '@playwright/test'

const englishNav = ['MEMBERS', 'PROJECTS', 'SUPPORT', 'NEWS', 'ABOUT', 'CONTACT']

test.describe('layout', () => {
  test('serves the English frame with the primary navigation', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveCount(1)
    await expect(page.getByRole('navigation').getByRole('link')).toHaveText(englishNav)
  })

  test('serves the Greek frame at /el', async ({ page }) => {
    await page.goto('/el')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.getByRole('navigation').getByRole('link').first()).toHaveText('ΜΕΛΗ')
    await expect(page.locator('link[rel="alternate"][hreflang="el"]')).toHaveAttribute('href', /\/el/)
  })

  test('the language switcher links to both equivalents', async ({ page }) => {
    await page.goto('/')
    const switcher = page.getByRole('group', { name: 'Language' })

    await expect(switcher.getByRole('link', { name: 'EN' })).toHaveAttribute('href', '/')
    await expect(switcher.getByRole('link', { name: 'ΕΛ' })).toHaveAttribute('href', '/el')
  })

  test('staging adds noindex and the footer badge', async ({ page }) => {
    test.skip(process.env.PUBLIC_STAGING !== 'true')

    await page.goto('/')

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(
      page.locator('footer').getByText('STAGING — not the public site'),
    ).toBeVisible()
  })

  test('a public build has no staging marker', async ({ page }) => {
    test.skip(process.env.PUBLIC_STAGING === 'true')

    await page.goto('/')

    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
    await expect(page.getByText('STAGING — not the public site')).toHaveCount(0)
  })
})

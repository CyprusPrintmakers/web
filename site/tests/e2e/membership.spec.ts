import { expect, test } from '@playwright/test'

test.describe('membership', () => {
  test('is the application page, not the tier table', async ({ page }) => {
    await page.goto('/membership')

    await expect(page.locator('[data-tier]')).toHaveCount(0)
    await expect(page.getByText('Choose the tier')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /become a member/i })).toHaveAttribute(
      'href',
      '/members',
    )
    await expect(page.locator('form[action="/api/membership"]')).toHaveCount(1)
  })

  test('greek application page has translated labels', async ({ page }) => {
    await page.goto('/el/membership')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.getByRole('link', { name: /γίνετε μέλος/i })).toBeVisible()
    await expect(page.getByLabel(/ονοματεπώνυμο/i)).toBeVisible()
  })

  test('hosts the privacy note section and the application form', async ({ page }) => {
    await page.goto('/membership')

    await expect(page.locator('#privacy')).toBeVisible()
    await expect(page.locator('form[action="/api/membership"]')).toHaveCount(1)
  })
})

test.describe('support', () => {
  test('renders the sponsorship tiers through the same gate', async ({ page }) => {
    await page.goto('/support')

    await expect(page.locator('[data-tier]').first()).toBeVisible()
    await expect(page.getByText('€')).toHaveCount(0)
  })
})

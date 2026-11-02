import { expect, test } from '@playwright/test'

test.describe('membership', () => {
  test('gates all prices until tiers are confirmed', async ({ page }) => {
    await page.goto('/membership')

    await expect(page.getByText('terms to be confirmed')).toBeVisible()
    await expect(page.getByText('€50')).toHaveCount(0)
    await expect(page.getByText('€90')).toHaveCount(0)
    await expect(page.getByText('€250')).toHaveCount(0)
  })

  test('renders three tiers with corporate levels', async ({ page }) => {
    await page.goto('/membership')

    await expect(page.locator('[data-tier]')).toHaveCount(3)
    await expect(page.locator('[data-tier]').last()).toContainText('Silver')
    await expect(page.locator('[data-tier]').last()).toContainText('Gold')
    await expect(page.locator('[data-tier]').last()).toContainText('Platinum')
  })

  test('greek tiers are translated', async ({ page }) => {
    await page.goto('/el/membership')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.locator('[data-tier]').first()).not.toContainText('Individual')
    await expect(page.locator('[data-tier]').first()).toContainText('Ατομική')
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

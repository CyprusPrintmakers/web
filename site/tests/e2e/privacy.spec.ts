import { expect, test } from '@playwright/test'

test.describe('privacy policy', () => {
  test('renders the policy and links back to membership', async ({ page }) => {
    await page.goto('/privacy')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy policy')
    await expect(page.getByRole('heading', { name: 'Who we are' })).toBeVisible()
    await expect(page.getByText('Office of the Commissioner for Personal Data Protection')).toBeVisible()
    await expect(page.getByRole('link', { name: /membership/i })).toHaveAttribute('href', '/membership')
  })

  test('the footer links to the policy on every page', async ({ page }) => {
    await page.goto('/about')
    const link = page.locator('footer a[href="/privacy"]')
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/privacy$/)
  })

  test('the greek page notes that the policy is in English', async ({ page }) => {
    await page.goto('/el/privacy')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Πολιτική')
    await expect(page.locator('main [lang="en"]')).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })

  test('the consent label points at the policy', async ({ page }) => {
    await page.goto('/membership')

    await expect(page.locator('label a[href="/privacy"]')).toBeVisible()
    await expect(page.locator('#privacy a[href="/privacy"]')).toBeVisible()
  })
})

import { expect, test } from '@playwright/test'

test('internal navigation is client-side and updates content', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    ;(window as unknown as { __sameDocument: boolean }).__sameDocument = true
  })
  await page.getByRole('navigation').getByRole('link', { name: 'MEMBERS' }).click()
  await expect(page).toHaveURL(/\/members$/)
  await expect(page.getByRole('heading', { name: /committee/i })).toBeVisible()
  expect(
    await page.evaluate(
      () => (window as unknown as { __sameDocument?: boolean }).__sameDocument,
    ),
  ).toBe(true)
})

test('focus and scroll reset after navigation', async ({ page }) => {
  await page.goto('/news')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.getByRole('navigation').getByRole('link', { name: 'MEMBERS' }).click()
  await expect(page).toHaveURL(/\/members$/)
  expect(await page.evaluate(() => document.activeElement?.tagName.toLowerCase())).toBe('main')
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('navigation still swaps content', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation').getByRole('link', { name: 'NEWS' }).click()
    await expect(page).toHaveURL(/\/news$/)
    await expect(page.locator('main h1')).toBeVisible()
  })
})
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

test('member filter still works after navigating away and back', async ({ page }) => {
  await page.goto('/members')
  await page.fill('[data-member-search]', 'geo')
  await expect(page.locator('[data-member]:visible')).toHaveCount(1)
  await page.getByRole('navigation').getByRole('link', { name: 'ABOUT' }).click()
  await page.getByRole('navigation').getByRole('link', { name: 'MEMBERS' }).click()
  await page.fill('[data-member-search]', 'geo')
  await expect(page.locator('[data-member]:visible')).toHaveCount(1)
})

test('contact form still submits after navigating away and back', async ({ page }) => {
  await page.route('**/api/contact', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    }),
  )
  await page.goto('/contact')
  await page.getByLabel('Name').fill('Maria')
  await page.getByLabel('Email').fill('maria@example.com')
  await page.getByRole('textbox', { name: 'Message' }).fill('Hello')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByRole('status')).toContainText('Thank you')

  await page.getByRole('navigation').getByRole('link', { name: 'NEWS' }).click()
  await page.getByRole('navigation').getByRole('link', { name: 'CONTACT' }).click()
  await page.getByLabel('Name').fill('Maria')
  await page.getByLabel('Email').fill('maria@example.com')
  await page.getByRole('textbox', { name: 'Message' }).fill('Again')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByRole('status')).toContainText('Thank you')
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
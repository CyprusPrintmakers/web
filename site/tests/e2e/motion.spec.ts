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

test('intro plays once on a full home load', async ({ page }) => {
  // Delay the timeline module so the assertion cannot race the 1.4 s animation.
  await page.route('**/scripts/intro.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 800))
    await route.continue()
  })
  await page.goto('/')
  await expect(page.locator('[data-home-intro]')).toBeVisible()
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 4000 })
  expect(await page.evaluate(() => sessionStorage.getItem('cp:intro'))).toBe('1')

  await page.reload()
  await expect(page.locator('[data-home-intro]')).toBeHidden()
})

test('Escape skips the intro', async ({ page }) => {
  await page.goto('/')
  // data-intro-ran is set after the skip listeners are installed, so this
  // guarantees the key handler is in place.
  await expect(page.locator('[data-home-intro][data-intro-ran]')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 1000 })
})

test.describe('intro with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('never appears', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-home-intro]')).toBeHidden()
  })
})

test.describe('intro without JS', () => {
  test.use({ javaScriptEnabled: false })
  test('content is visible and no overlay is shown', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-home-intro]')).toBeHidden()
    await expect(page.getByText(/CURRENT:/)).toBeVisible()
  })
})

test('client arrival at home does not replay the intro', async ({ page }) => {
  await page.goto('/about')
  await page.locator('header .brand').click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('[data-home-intro]')).toBeHidden()
})

test('Greek intro has no overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/el')
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 3000 })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})
import { expect, test } from '@playwright/test'

test.describe('theme', () => {
  test('follows the system preference by default', async ({ browser }) => {
    const dark = await browser.newContext({ colorScheme: 'dark' })
    const page = await dark.newPage()
    await page.goto('/about')

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.getByRole('button', { name: /dark mode/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await dark.close()
  })

  test('the switch flips the theme and survives a reload', async ({ page }) => {
    await page.goto('/about')

    const toggle = page.getByRole('button', { name: /dark mode/i })
    const before = await page.locator('html').getAttribute('data-theme')
    await toggle.click()
    const after = await page.locator('html').getAttribute('data-theme')

    expect(after).not.toBe(before)
    await expect(toggle).toHaveAttribute('aria-pressed', String(after === 'dark'))

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', after ?? '')
  })

  test('keeps the chosen theme across client-side navigation', async ({ page }) => {
    await page.goto('/about')

    const before = await page.locator('html').getAttribute('data-theme')
    const target = before === 'dark' ? 'light' : 'dark'
    await page.getByRole('button', { name: /dark mode/i }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', target)

    await page.getByRole('navigation').getByRole('link', { name: /members/i }).click()
    await expect(page).toHaveURL(/\/members$/)
    await expect(page.locator('html')).toHaveAttribute('data-theme', target)
    await expect(page.getByRole('button', { name: /dark mode/i })).toHaveAttribute(
      'aria-pressed',
      String(target === 'dark'),
    )
  })

  test('keeps the mark readable and the meta colour in step', async ({ page }) => {
    await page.goto('/about')
    await page.getByRole('button', { name: /dark mode/i }).click()

    const meta = await page.locator('meta[name="theme-color"]').getAttribute('content')
    expect(meta).toBe('#0b0b0b')

    const filter = await page
      .locator('.header__mark')
      .evaluate(element => getComputedStyle(element).filter)
    expect(filter).toContain('invert')
  })
})

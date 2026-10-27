import { expect, test } from '@playwright/test'

test.describe('news index', () => {
  test('lists the fixtures newest first', async ({ page }) => {
    await page.goto('/news')

    await expect(page.locator('[data-post]')).toHaveCount(2)
    const first = page.locator('[data-post]').first()
    await expect(first).toContainText('2026')
  })

  test('greek index labels the list in greek', async ({ page }) => {
    await page.goto('/el/news')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/νέα/i)
    await expect(page.locator('[data-post]')).toHaveCount(2)
  })
})

test.describe('news detail', () => {
  test('renders the body and metadata', async ({ page }) => {
    await page.goto('/news/printmaking-days-2026')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('time')).toHaveText(/2026/)
    await expect(page.locator('main a[href="/projects/printmaking-days-2019"]')).toBeVisible()
  })

  test('greek detail renders', async ({ page }) => {
    await page.goto('/el/news/spring-workshops-2025')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('rss', () => {
  test('english feed lists both posts', async ({ request }) => {
    const response = await request.get('/rss.xml')
    const xml = await response.text()

    expect(xml).toContain('<?xml')
    expect(xml).toContain('/news/printmaking-days-2026')
    expect(xml).toContain('/news/spring-workshops-2025')
  })

  test('greek feed exists with greek links', async ({ request }) => {
    const response = await request.get('/el/rss.xml')
    const xml = await response.text()

    expect(xml).toContain('/el/news/printmaking-days-2026')
  })
})

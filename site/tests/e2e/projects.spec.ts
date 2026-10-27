import { expect, test } from '@playwright/test'

test.describe('projects index', () => {
  test('lists all projects newest first', async ({ page }) => {
    await page.goto('/projects')

    await expect(page.locator('[data-project]')).toHaveCount(3)
    const first = page.locator('[data-project]').first()
    await expect(first).toContainText('2019')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/projects/i)
  })

  test('filters by year client-side', async ({ page }) => {
    await page.goto('/projects')

    await page.getByRole('button', { name: '2019' }).click()
    await expect(page.locator('[data-project]:not([hidden])')).toHaveCount(1)
    await expect(page.locator('[data-project]:not([hidden])')).toContainText('2019')

    await page.getByRole('button', { name: /all years/i }).click()
    await expect(page.locator('[data-project]:not([hidden])')).toHaveCount(3)
  })

  test('greek index renders greek labels', async ({ page }) => {
    await page.goto('/el/projects')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.locator('[data-project]')).toHaveCount(3)
    await expect(page.getByRole('button', { name: /όλα τα έτη/i })).toBeVisible()
  })

  test('the full list is in the HTML without JavaScript', async ({ browser }) => {
    const noJs = await browser.newContext({ javaScriptEnabled: false })
    const raw = await noJs.newPage()

    await raw.goto('http://localhost:4321/projects')
    await expect(raw.locator('[data-project]')).toHaveCount(3)

    await noJs.close()
  })
})

test.describe('project detail', () => {
  test('renders summary, metadata and gallery', async ({ page }) => {
    await page.goto('/projects/printmaking-days-2019')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('[data-gallery] [data-gallery-item]')).toHaveCount(2)
    await expect(page.getByText(/participants/i).first()).toBeVisible()
    await expect(page.locator('main a[rel="noopener"]').first()).toBeVisible()
  })

  test('a project without a gallery renders no gallery section', async ({ page }) => {
    await page.goto('/projects/printmaking-days-2017')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('[data-gallery]')).toHaveCount(0)
  })

  test('greek detail renders the greek title', async ({ page }) => {
    await page.goto('/el/projects/printmaking-days-2019')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

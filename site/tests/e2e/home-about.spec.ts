import { expect, test } from '@playwright/test'
import { enterHome } from './helpers'

test.describe('home', () => {
  test('english home renders the wordmark h1 and the current line', async ({ page }) => {
    await page.goto('/')
    await enterHome(page)

    await expect(
      page.getByRole('heading', { level: 1 }),
    ).toHaveText('CYPRUS PRINTMAKERS ASSOCIATION')
    await expect(page.getByText('CURRENT:')).toBeVisible()
  })

  test('the current line pins to the bottom of the viewport-height cover', async ({ page }) => {
    await page.goto('/')
    await enterHome(page)

    const current = page.getByText('CURRENT:')
    const box = await current.boundingBox()
    const viewport = page.viewportSize()

    expect(box).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(box!.y + box!.height).toBeGreaterThan(viewport!.height - 160)
  })

  test('greek home shows ΤΩΡΑ:', async ({ page }) => {
    await page.goto('/el')
    await enterHome(page)

    await expect(page.getByText('ΤΩΡΑ:')).toBeVisible()
  })
})

test.describe('about', () => {
  test('english about renders the committee heading', async ({ page }) => {
    await page.goto('/about')

    await expect(page.getByRole('heading', { name: /committee/i })).toBeVisible()
    await expect(page.locator('img').first()).toHaveAttribute('width')
  })

  test('greek about renders at /el/about', async ({ page }) => {
    await page.goto('/el/about')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(
      page.getByRole('heading', { name: /επιτροπή/i }),
    ).toBeVisible()
  })
})

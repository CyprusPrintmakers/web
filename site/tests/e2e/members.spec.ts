import { expect, test } from '@playwright/test'

test.describe('members index', () => {
  test('shows committee and a name-only directory', async ({ page }) => {
    await page.goto('/members')

    await expect(page.getByRole('heading', { name: /committee/i })).toBeVisible()
    await expect(page.locator('[data-member]')).toHaveCount(3)
    await expect(page.locator('[data-member-count]')).toHaveText('3 members')
    await expect(page.locator('.members__entry')).toHaveCount(0)
    await expect(page.locator('main a[href^="/members/"]')).toHaveCount(0)
    await expect(page.locator('main img')).toHaveCount(0)
    await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(0)
  })

  test('puts a website arrow next to the name that has a site', async ({ page }) => {
    await page.goto('/members')

    const row = page.locator('[data-member]').filter({ hasText: 'Maria Georgiou' })
    const link = row.getByRole('link', { name: /Website/ })
    await expect(link).toHaveAttribute('href', 'https://mariageorgiou.example')
    await expect(link.locator('svg')).toHaveCount(1)

    const box = await link.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(24)
    expect(box!.height).toBeGreaterThanOrEqual(24)

    const noSite = page.locator('[data-member]').filter({ hasText: 'Andreas Petrou' })
    await expect(noSite.getByRole('link')).toHaveCount(0)
  })

  test('featured members do not link to profiles', async ({ page }) => {
    await page.goto('/members')

    await expect(page.getByRole('heading', { name: 'Featured members' })).toBeVisible()
    await expect(page.locator('.members__featured-list a[href^="/members/"]')).toHaveCount(0)
    await expect(page.locator('.members__featured-list a')).toHaveCount(2)
  })

  test('filters by first-name letter and updates the count', async ({ page }) => {
    await page.goto('/members')

    await page.getByRole('button', { name: 'M', exact: true }).click()
    await expect(page.locator('[data-member]:not([hidden])')).toHaveCount(1)
    await expect(page.locator('[data-member-count]')).toHaveText('1 member')

    await page.getByRole('button', { name: 'M', exact: true }).click()
    await expect(page.locator('[data-member]:not([hidden])')).toHaveCount(3)
    await expect(page.locator('[data-member-count]')).toHaveText('3 members')
  })

  test('greek index counts members in greek and stays noindex', async ({ page }) => {
    await page.goto('/el/members')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.locator('[data-member-count]')).toHaveText('3 μέλη')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })

  test('the full list is in the HTML without JavaScript', async ({ browser }) => {
    const noJs = await browser.newContext({ javaScriptEnabled: false })
    const raw = await noJs.newPage()

    const baseURL = String(test.info().project.use.baseURL)
    await raw.goto(`${baseURL}/members`)
    await expect(raw.locator('[data-member]')).toHaveCount(3)

    await noJs.close()
  })
})

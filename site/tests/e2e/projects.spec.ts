import { expect, test } from '@playwright/test'

test.describe('projects index', () => {
  test('lists all projects newest first', async ({ page }) => {
    await page.goto('/projects')

    await expect(page.locator('[data-project]')).toHaveCount(3)
    const first = page.locator('[data-project]').first()
    await expect(first).toContainText('2019')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/projects/i)
  })

  test('expands a project in place with its cover and summary', async ({ page }) => {
    await page.goto('/projects')

    const entry = page.locator('#project-printmaking-days-2019')
    await expect(entry).not.toHaveAttribute('open', '')
    await entry.locator('summary').click()

    await expect(entry).toHaveAttribute('open', '')
    await expect(entry.locator('.projects__summary')).toBeVisible()
    await expect(entry.getByRole('link', { name: /full project/i })).toHaveAttribute(
      'href',
      '/projects/printmaking-days-2019',
    )
  })

  test('keeps the year in the right column on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/projects')

    const headerRight = await page
      .locator('.projects__head span:last-child')
      .evaluate(el => el.getBoundingClientRect().right)
    const rows = await page
      .locator('[data-project] .projects__year')
      .evaluateAll(elements =>
        elements.map(element => element.getBoundingClientRect().right),
      )

    expect(rows.length).toBe(3)
    for (const right of rows) expect(Math.abs(right - headerRight)).toBeLessThanOrEqual(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
  })

  test('shows a cover preview while hovering a row', async ({ page }) => {
    await page.goto('/projects')

    const row = page.locator('[data-project]').first()
    await row.evaluate(element => element.setAttribute('data-preview', '/favicon-32.png'))
    await row.hover()

    const preview = page.locator('[data-project-preview]')
    await expect(preview).toHaveClass(/is-visible/)
    await expect(preview.locator('img')).toHaveAttribute('src', /.+/)
  })

  test('greek index renders greek labels', async ({ page }) => {
    await page.goto('/el/projects')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.locator('[data-project]')).toHaveCount(3)
    await expect(page.locator('.projects__head')).toContainText('Έργο')
  })

  test('the full list is in the HTML without JavaScript', async ({ browser }) => {
    const noJs = await browser.newContext({ javaScriptEnabled: false })
    const raw = await noJs.newPage()

    const baseURL = String(test.info().project.use.baseURL)
    await raw.goto(`${baseURL}/projects`)
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

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

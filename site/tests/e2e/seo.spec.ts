import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test.describe('seo surface', () => {
  test('english pages carry canonical, hreflang and x-default', async ({ page }) => {
    await page.goto('/about')

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://cyprintmakers.densetheory.cc/about',
    )
    await expect(page.locator('link[hreflang="el"]')).toHaveCount(1)
    await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
      'href',
      /\/about$/,
    )
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1)
    const orgLd = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(orgLd).toContain('Organization')
  })

  test('greek pages point back at the english alternate', async ({ page }) => {
    await page.goto('/el/about')

    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', /\/about$/)
    await expect(page.locator('link[hreflang="el"]')).toHaveAttribute('href', /\/el\/about$/)
  })

  test('unknown paths get the 404 page with a greek link', async ({ page }) => {
    await page.goto('/nope')

    await expect(page.getByRole('heading')).toContainText('404')
    await expect(page.locator('article a[href="/el"]')).toBeVisible()
  })

  test('the built sitemap includes greek alternates and skips the 404', async () => {
    // The sitemap is a build-time artefact, so read it from the last build
    // output rather than the dev server.
    const xml = readFileSync(new URL('../../dist/client/sitemap-0.xml', import.meta.url), 'utf8')

    expect(xml).toContain('/el/about')
    expect(xml).not.toContain('404')
  })

  test('robots.txt allows crawlers with a sitemap pointer outside staging', async ({
    request,
  }) => {
    const response = await request.get('/robots.txt')
    const body = await response.text()

    expect(body).toMatch(/User-agent: \*/)
    expect(body).toMatch(/Allow: \//)
    expect(body).toContain('Sitemap:')
  })

  test('a greek member with untranslated prose renders in english and stays out of the index', async ({
    page,
  }) => {
    await page.goto('/el/members/andreas-petrou')

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(page.locator('main [lang="en"]').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Andreas Petrou')
  })

  test('fully translated greek pages stay indexable', async ({ page }) => {
    await page.goto('/el/members/georgiou')

    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
  })

  test('news and project pages carry their JSON-LD types', async ({ page }) => {
    await page.goto('/news/printmaking-days-2026')
    const article = await page
      .locator('script[type="application/ld+json"]')
      .last()
      .textContent()
    expect(article).toContain('Article')

    await page.goto('/projects/printmaking-days-2019')
    const artwork = await page
      .locator('script[type="application/ld+json"]')
      .last()
      .textContent()
    expect(artwork).toContain('VisualArtwork')
  })
})

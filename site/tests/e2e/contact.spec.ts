import { expect, test } from '@playwright/test'

test.describe('contact', () => {
  test('english contact shows the address and a plain mailto link', async ({ page }) => {
    await page.goto('/contact')

    await expect(page.getByText('Agiou 7')).toBeVisible()
    await expect(
      page.getByRole('link', { name: /cyprintmakers@gmail.com/ }),
    ).toHaveAttribute('href', 'mailto:cyprintmakers@gmail.com')
    await expect(page.getByRole('link', { name: /0035799351153/ })).toHaveAttribute(
      'href',
      'tel:+35799351153',
    )

    const mapLink = page.locator('a[href*="maps.google"]')
    await expect(mapLink).toBeVisible()
    await expect(mapLink).toHaveAttribute('rel', 'noopener')
  })

  test('greek contact renders at /el/contact with the tel link', async ({ page }) => {
    await page.goto('/el/contact')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.getByRole('link', { name: /0035799351153/ })).toHaveAttribute(
      'href',
      'tel:+35799351153',
    )
    await expect(page.getByText('Agiou 7')).toBeVisible()
  })

  test('both locales host the contact form', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.locator('form[action="/api/contact"]')).toHaveCount(1)
    await expect(page.locator('input[name="locale"]')).toHaveValue('en')

    await page.goto('/el/contact')
    await expect(page.locator('form[action="/api/contact"]')).toHaveCount(1)
    await expect(page.locator('input[name="locale"]')).toHaveValue('el')
  })
})

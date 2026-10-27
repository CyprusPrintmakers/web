import { expect, test } from '@playwright/test'

test.describe('membership form', () => {
  test('submits inline and shows a status message', async ({ page }) => {
    await page.route('**/api/membership', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      }),
    )
    await page.goto('/membership')

    await page.getByLabel('Name').fill('Maria')
    await page.getByLabel('Email').fill('maria@example.com')
    await page.getByRole('checkbox', { name: /privacy/ }).check()
    await page.getByRole('button', { name: 'Send application' }).click()

    await expect(page.getByRole('status')).toContainText('Thank you')
  })

  test('renders server-provided field errors against the field', async ({ page }) => {
    await page.route('**/api/membership', route =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          errors: { email: 'Εισαγάγετε μια έγκυρη διεύθυνση email' },
        }),
      }),
    )
    await page.goto('/el/membership')

    await page.getByRole('button', { name: 'Υποβολή' }).click()

    await expect(page.locator('[data-error="email"]')).toHaveText(
      'Εισαγάγετε μια έγκυρη διεύθυνση email',
    )
  })

  test('native submit without JS still gets a readable page', async ({ browser }) => {
    const noJs = await browser.newContext({ javaScriptEnabled: false })
    const raw = await noJs.newPage()

    await raw.route('**/api/membership', route =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<h1>Thank you</h1>',
      }),
    )
    await raw.goto('http://localhost:4321/membership')

    await raw.getByLabel('Name').fill('Maria')
    await raw.getByLabel('Email').fill('maria@example.com')
    await raw.getByRole('checkbox', { name: /privacy/ }).check()
    await raw.getByRole('button', { name: 'Send application' }).click()

    await expect(raw.getByRole('heading')).toContainText('Thank you')
    await noJs.close()
  })

  test('the honeypot and locale fields ship in the markup', async ({ page }) => {
    await page.goto('/membership')

    await expect(page.locator('form[action="/api/membership"]')).toHaveCount(1)
    await expect(page.locator('input[name="locale"]')).toHaveValue('en')
    // forms.js fills renderedAt on load; the velocity check only applies when
    // it parses as a number, so a no-JS submit is never rejected on timing.
    await expect(page.locator('input[name="renderedAt"]')).toHaveValue(/^\d+$/)
    await expect(page.locator('[aria-hidden="true"] input[name="website"]')).toHaveCount(1)
    await expect(page.locator('input[name="cv"]')).toHaveAttribute('accept', /.pdf/)
  })

  test('the consent label links to the privacy section', async ({ page }) => {
    await page.goto('/membership')

    await expect(page.locator('label a[href="#privacy"]')).toBeVisible()
    await expect(page.locator('#privacy')).toBeVisible()
  })
})

test.describe('contact form', () => {
  test('submits inline and shows a status message', async ({ page }) => {
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
  })
})

import { expect, test } from '@playwright/test'

const cvFile = {
  name: 'cv.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4 test fixture'),
}

async function fillApplication(page: import('@playwright/test').Page, lang: 'en' | 'el' = 'en') {
  const labels =
    lang === 'el'
      ? { name: /ονοματεπώνυμο/i, why: /γιατί θέλετε/i, cv: /βιογραφικό/i }
      : { name: /full name/i, why: /why do you want/i, cv: /send us your cv/i }

  await page.getByLabel(labels.name).fill('Maria')
  await page.getByLabel('Email').fill('maria@example.com')
  await page.getByLabel(labels.why).fill('I would like to join the association.')
  await page.getByLabel(labels.cv).setInputFiles(cvFile)
  await page.getByRole('checkbox', { name: /privacy|απόρρητο/i }).check()
}

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

    await fillApplication(page)
    await page.getByRole('button', { name: 'Submit' }).click()

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
    const baseURL = String(test.info().project.use.baseURL)
    await raw.goto(`${baseURL}/membership`)

    await fillApplication(raw)
    await raw.getByRole('button', { name: 'Submit' }).click()

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

    await expect(page.locator('label a[href="/privacy"]')).toBeVisible()
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

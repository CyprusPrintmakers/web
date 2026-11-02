import { expect, test } from '@playwright/test'
import { enterHome } from './helpers'

test('internal navigation is client-side and updates content', async ({ page }) => {
  await page.goto('/')
  await enterHome(page)
  await page.evaluate(() => {
    ;(window as unknown as { __sameDocument: boolean }).__sameDocument = true
  })
  await page.getByRole('navigation').getByRole('link', { name: 'MEMBERS' }).click()
  await expect(page).toHaveURL(/\/members$/)
  await expect(page.getByRole('heading', { name: /committee/i })).toBeVisible()
  expect(
    await page.evaluate(
      () => (window as unknown as { __sameDocument?: boolean }).__sameDocument,
    ),
  ).toBe(true)
})

test('focus and scroll reset after navigation', async ({ page }) => {
  await page.goto('/members')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  // dispatchEvent avoids Playwright scrolling the header link into view first,
  // which would reset scroll before the router gets a chance to.
  await page.getByRole('navigation').getByRole('link', { name: 'NEWS' }).dispatchEvent('click')
  await expect(page).toHaveURL(/\/news$/)
  await expect(page.locator('main h1')).toBeVisible()
  expect(await page.evaluate(() => document.activeElement?.tagName.toLowerCase())).toBe('main')
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test('member filter still works after navigating away and back', async ({ page }) => {
  await page.goto('/members')
  await page.fill('[data-member-search]', 'geo')
  await expect(page.locator('[data-member]:visible')).toHaveCount(1)
  await page.getByRole('navigation').getByRole('link', { name: 'ABOUT' }).click()
  await page.getByRole('navigation').getByRole('link', { name: 'MEMBERS' }).click()
  await page.fill('[data-member-search]', 'geo')
  await expect(page.locator('[data-member]:visible')).toHaveCount(1)
})

test('contact form still submits after navigating away and back', async ({ page }) => {
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

  await page.getByRole('navigation').getByRole('link', { name: 'NEWS' }).click()
  await page.getByRole('navigation').getByRole('link', { name: 'CONTACT' }).click()
  await page.getByLabel('Name').fill('Maria')
  await page.getByLabel('Email').fill('maria@example.com')
  await page.getByRole('textbox', { name: 'Message' }).fill('Again')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByRole('status')).toContainText('Thank you')
})

test('membership form still submits after navigating away and back', async ({ page }) => {
  await page.route('**/api/membership', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    }),
  )
  const submit = async () => {
    await page.getByLabel('Name').fill('Maria')
    await page.getByLabel('Email').fill('maria@example.com')
    await page.getByRole('checkbox', { name: /privacy/ }).check()
    await page.getByRole('button', { name: 'Send application' }).click()
    await expect(page.getByRole('status')).toContainText('Thank you')
  }

  const navigateTo = (path: string) =>
    page.evaluate(path => {
      const link = document.createElement('a')
      link.href = path
      document.body.append(link)
      link.click()
      link.remove()
    }, path)

  await page.goto('/membership')
  await submit()
  await navigateTo('/news')
  await expect(page).toHaveURL(/\/news$/)
  await navigateTo('/membership')
  await expect(page).toHaveURL(/\/membership$/)
  await submit()
})

test('projects filter still works after navigating away and back', async ({ page }) => {
  await page.goto('/projects')
  await page.getByRole('button', { name: '2019' }).click()
  await expect(page.locator('[data-project]:not([hidden])')).toHaveCount(1)
  await page.getByRole('navigation').getByRole('link', { name: 'ABOUT' }).click()
  await page.getByRole('navigation').getByRole('link', { name: 'PROJECTS' }).click()
  await page.getByRole('button', { name: '2019' }).click()
  await expect(page.locator('[data-project]:not([hidden])')).toHaveCount(1)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('navigation still swaps content', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation').getByRole('link', { name: 'NEWS' }).click()
    await expect(page).toHaveURL(/\/news$/)
    await expect(page.locator('main h1')).toBeVisible()
  })

  test('view-transition animations are disabled', async ({ page }) => {
    await page.goto('/')
    const disabled = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList
        try {
          rules = sheet.cssRules
        } catch {
          continue
        }
        for (const rule of Array.from(rules)) {
          if (
            rule.cssText.includes('view-transition') &&
            /animation[^;]*none/.test(rule.cssText)
          ) {
            return true
          }
        }
      }
      return false
    })
    expect(disabled).toBe(true)
  })
})

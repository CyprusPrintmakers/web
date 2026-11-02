import { expect, test } from '@playwright/test'

test('internal navigation is client-side and updates content', async ({ page }) => {
  await page.goto('/')
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

test('intro plays once on a full home load', async ({ page }) => {
  // Delay the timeline module so the assertion cannot race the 1.4 s animation.
  await page.route('**/scripts/intro.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 800))
    await route.continue()
  })
  await page.goto('/')
  await expect(page.locator('[data-home-intro]')).toBeVisible()
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 4000 })
  expect(await page.evaluate(() => sessionStorage.getItem('cp:intro'))).toBe('1')

  await page.reload()
  await expect(page.locator('[data-home-intro]')).toBeHidden()
})

test('Escape skips the intro', async ({ page }) => {
  await page.goto('/')
  // data-intro-ran is set after the skip listeners are installed, so this
  // guarantees the key handler is in place.
  await expect(page.locator('[data-home-intro][data-intro-ran]')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 1000 })
})

test.describe('intro with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('never appears', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-home-intro]')).toBeHidden()
  })
})

test.describe('intro without JS', () => {
  test.use({ javaScriptEnabled: false })
  test('content is visible and no overlay is shown', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-home-intro]')).toBeHidden()
    await expect(page.getByText(/CURRENT:/)).toBeVisible()
  })
})

test('client arrival at home does not replay the intro', async ({ page }) => {
  await page.goto('/about')
  await page.locator('header .brand').click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('[data-home-intro]')).toBeHidden()
})

test('Greek intro has no overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/el')
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 3000 })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

for (const path of ['/', '/el']) {
  test(`intro hand-off matches the header at 320px (${path})`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto(path)
    await page.waitForFunction(
      () => document.documentElement.dataset.intro === 'handoff',
      { timeout: 4000 },
    )

    const diff = await page.evaluate(() => {
      const clone = document.querySelector('[data-home-intro] .brand')
      const real = document.querySelector('header .brand')
      if (!(clone instanceof HTMLElement) || !(real instanceof HTMLElement)) return null
      const a = clone.getBoundingClientRect()
      const b = real.getBoundingClientRect()
      return {
        dx: Math.abs(a.left - b.left),
        dy: Math.abs(a.top - b.top),
        dw: Math.abs(a.width - b.width),
        dh: Math.abs(a.height - b.height),
      }
    })

    expect(diff).not.toBeNull()
    for (const value of Object.values(diff!)) expect(value).toBeLessThanOrEqual(1)
  })
}

test('a failed intro module still shows the brand and unblocks', async ({ page }) => {
  await page.route('**/scripts/intro.js', route => route.abort())
  await page.goto('/')
  await expect(page.locator('[data-home-intro] .brand')).toBeVisible()
  const stageOpacity = await page
    .locator('[data-home-intro] .intro__stage')
    .evaluate(element => getComputedStyle(element).opacity)
  expect(Number(stageOpacity)).toBeGreaterThan(0)
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 5000 })
})

test('the faded overlay does not intercept clicks', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('html[data-intro="revealing"]', { timeout: 4000 })
  await page.waitForTimeout(400)

  const blocked = await page.evaluate(() => {
    const link = document.querySelector('nav a')
    if (!(link instanceof HTMLElement)) return true
    const rect = link.getBoundingClientRect()
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    )
    return hit instanceof Element && hit.closest('[data-home-intro]') !== null
  })

  expect(blocked).toBe(false)
})
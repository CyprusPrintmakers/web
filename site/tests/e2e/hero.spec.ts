import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { enterHome } from './helpers'

test('the cover waits for a click and keeps the page out of reach', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-home-intro]')).toBeVisible()
  await expect(page.getByRole('button', { name: /Enter the Cyprus/ })).toBeVisible()
  await expect(page.locator('h1[data-hero-lockup]')).toBeHidden()
  await expect(page.locator('.skip-link')).toBeHidden()
  await expect(page.getByRole('navigation').getByRole('link').first()).toBeHidden()

  await page.getByRole('button', { name: /Enter the Cyprus/ }).click()
  const body = page.locator('[data-hero-intro-body]')

  // ~700 ms in, the paragraph must be mid-reveal: soft opacity and a
  // still-closing downward mask, not instantly fully opaque.
  await page.waitForTimeout(700)
  const mid = await body.evaluate(el => {
    const style = getComputedStyle(el)
    return { opacity: Number(style.opacity), clip: style.clipPath }
  })
  expect(mid.opacity).toBeGreaterThan(0.05)
  expect(mid.opacity).toBeLessThan(0.9)
  expect(mid.clip).toMatch(/inset\(0px 0px [1-9][0-9]*\.\d+%\)/)

  await expect(body).toBeHidden({ timeout: 12000 })
  const end = await body.evaluate(el => {
    const style = getComputedStyle(el)
    return { opacity: Number(style.opacity), visibility: style.visibility }
  })
  expect(end).toEqual({ opacity: 0, visibility: 'hidden' })

  await expect(page.locator('[data-home-intro]')).toBeHidden()
  await expect(page.locator('h1[data-hero-lockup]')).toBeVisible()
  await expect(page.getByText('CURRENT:')).toBeVisible()
  await expect(page.getByRole('navigation').getByRole('link').first()).toBeVisible()
  expect(await page.evaluate(() => document.activeElement?.tagName.toLowerCase())).toBe('main')
})

test('every full load shows the cover, but a client arrival does not', async ({ page }) => {
  await page.goto('/')
  await enterHome(page)
  await page.reload()
  await expect(page.locator('[data-home-intro]')).toBeVisible()

  await page.goto('/about')
  await page.locator('header .brand').click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('[data-home-intro]')).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('Escape skips the sequence', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Enter the Cyprus/ }).click()
  await page.waitForFunction(() => document.documentElement.dataset.intro === 'moving')
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 2000 })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.evaluate(() => document.activeElement?.tagName.toLowerCase())).toBe('main')
})

test('Escape while the cover waits reveals the hero and lands focus on main', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('[data-home-intro]')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 2000 })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.evaluate(() => document.activeElement?.tagName.toLowerCase())).toBe('main')
})

test('the cover is keyboard operable', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Enter the Cyprus/ }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-hero-intro-body]')).toBeVisible({ timeout: 5000 })
})

test('the skip link is hidden and tab cannot leave the cover button', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-home-intro]')).toBeVisible()
  await expect(page.locator('.skip-link')).toBeHidden()

  // The Astro dev toolbar appends its own buttons in dev; remove it so the
  // cover button is the only focusable element, as it is on a built site.
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove())

  // The cover button is the only visible element in the tab order.
  const tabbable = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]',
      ),
    )
      .filter(
        el =>
          el instanceof HTMLElement &&
          el.tabIndex >= 0 &&
          getComputedStyle(el).visibility === 'visible',
      )
      .map(el => el.className),
  )
  expect(tabbable).toEqual(['intro__enter'])

  // Tab and Shift+Tab can reach nothing else: focus stays on the cover
  // button or resets to the document root (Chromium's idle state between
  // wraps), never the skip link, navigation or footer.
  await page.getByRole('button', { name: /Enter the Cyprus/ }).focus()
  for (const key of ['Tab', 'Tab', 'Shift+Tab']) {
    await page.keyboard.press(key)
    expect(
      await page.evaluate(() => {
        const el = document.activeElement
        return el === document.querySelector('.intro__enter') || el === document.body
      }),
    ).toBe(true)
  }
})

test('the header brand is only hidden on home', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('header .brand')).toHaveCount(0)
  await page.goto('/about')
  await expect(page.locator('header .brand')).toHaveCount(1)
})

test('a failed intro module reveals the hero', async ({ page }) => {
  await page.route('**/scripts/intro.js', route => route.abort())
  await page.goto('/')
  await expect(page.locator('[data-home-intro] .hero-brand__mark')).toBeVisible()
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 5000 })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('the cover has no axe violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
    .analyze()
  expect(results.violations).toEqual([])
})

test('the cover holds until clicked', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-home-intro]')).toBeVisible()
  await page.waitForTimeout(500)
  expect(await page.evaluate(() => document.documentElement.dataset.intro)).toBe('pending')
  await expect(page.locator('h1[data-hero-lockup]')).toBeHidden()
})

test('enabling reduced motion while the cover waits reveals the hero', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-home-intro]')).toBeVisible()

  // The dev toolbar steals focus when it initialises; remove it so the
  // focus assertion measures the module's own behaviour, not dev tooling.
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove())

  // Let the initial view transition settle before changing the preference.
  await page.waitForTimeout(600)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('[data-home-intro]')).toBeHidden()
  await expect(page.locator('h1[data-hero-lockup]')).toBeVisible()
  // Poll on a timer while the media-change focus task settles.
  await page.waitForFunction(
    () => document.activeElement?.tagName.toLowerCase() === 'main',
    null,
    { timeout: 5000, polling: 100 },
  )
})

test('the pending cover centres the logo mark in the viewport', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-home-intro]')).toBeVisible()
  // Fonts change the lockup's lead width, so wait for the settled layout.
  await page.evaluate(() => document.fonts.ready)
  const diff = await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.cancel()
    const mark = document.querySelector('.intro__stage .hero-brand__mark')
    if (!(mark instanceof HTMLElement)) return null
    const rect = mark.getBoundingClientRect()
    return {
      dx: Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2),
      dy: Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2),
    }
  })
  expect(diff).not.toBeNull()
  expect(diff!.dx).toBeLessThanOrEqual(1)
  expect(diff!.dy).toBeLessThanOrEqual(1)
})

test('a rejected animation promise still reveals the hero', async ({ page }) => {
  await page.addInitScript(() => {
    window.addEventListener('unhandledrejection', event => event.preventDefault())
    Object.defineProperty(Animation.prototype, 'finished', {
      configurable: true,
      get() {
        return Promise.reject(new Error('forced rejection'))
      },
    })
  })
  await page.goto('/')
  await page.getByRole('button', { name: /Enter the Cyprus/ }).click()
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 5000 })
  await expect(page.locator('h1[data-hero-lockup]')).toBeVisible()
  expect(await page.evaluate(() => document.activeElement?.tagName.toLowerCase())).toBe('main')
})

test('a stalled timeline is cleared by the watchdog', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Animation.prototype, 'finished', {
      configurable: true,
      get() {
        return new Promise(() => {})
      },
    })
  })
  await page.clock.install()
  await page.goto('/')
  await page.getByRole('button', { name: /Enter the Cyprus/ }).click()
  await page.waitForFunction(() => document.documentElement.dataset.intro === 'moving')
  await page.clock.fastForward(15000)
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 5000 })
  await expect(page.locator('h1[data-hero-lockup]')).toBeVisible()
  expect(await page.evaluate(() => document.activeElement?.tagName.toLowerCase())).toBe('main')
})

test('a 320×256 viewport reflows without footer overlap', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 })
  await page.goto('/')
  await enterHome(page)
  const boxes = await page.evaluate(() => {
    const footer = document.querySelector('.page footer')
    const current = document.querySelector('.home-cover__current')
    if (!(footer instanceof HTMLElement) || !(current instanceof HTMLElement)) return null
    return {
      footerTop: footer.getBoundingClientRect().top,
      currentBottom: current.getBoundingClientRect().bottom,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    }
  })
  expect(boxes).not.toBeNull()
  expect(boxes!.footerTop).toBeGreaterThanOrEqual(boxes!.currentBottom - 1)
  expect(boxes!.overflow).toBeLessThanOrEqual(1)
})

test('the desktop paragraph sits right of the wordmark, inside the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')
  await page.getByRole('button', { name: /Enter the Cyprus/ }).click()
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-hero-intro-body]')
    return el instanceof HTMLElement && getComputedStyle(el).opacity !== '0'
  })
  const box = await page.evaluate(() => {
    const el = document.querySelector('[data-hero-intro-body]')
    const mark = document.querySelector('.intro__stage .hero-brand__mark')
    if (!(el instanceof HTMLElement) || !(mark instanceof HTMLElement)) return null
    const b = el.getBoundingClientRect()
    const m = mark.getBoundingClientRect()
    return {
      left: b.left,
      right: b.right,
      top: b.top,
      bottom: b.bottom,
      markRight: m.right,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }
  })
  expect(box).not.toBeNull()
  expect(box!.left).toBeGreaterThanOrEqual(box!.markRight + 31)
  expect(box!.right).toBeLessThanOrEqual(box!.viewportWidth)
  expect(box!.top).toBeGreaterThanOrEqual(0)
  expect(box!.bottom).toBeLessThanOrEqual(box!.viewportHeight)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('goes straight to the hero', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-home-intro]')).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('without JS', () => {
  test.use({ javaScriptEnabled: false })
  test('goes straight to the hero', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-home-intro]')).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText('CURRENT:')).toBeVisible()
  })
})

test('the 320px Greek hand-off matches the hero lockup', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/el')
  // Scoped to the cover: the Astro dev toolbar also renders buttons in dev.
  await page.locator('[data-home-intro]').getByRole('button').click()
  await page.waitForFunction(() => document.documentElement.dataset.intro === 'handoff')

  const diff = await page.evaluate(() => {
    const overlay = document.querySelector('[data-hero-overlay]')
    const hero = document.querySelector('[data-hero-lockup]')
    if (!(overlay instanceof HTMLElement) || !(hero instanceof HTMLElement)) return null
    const a = overlay.getBoundingClientRect()
    const b = hero.getBoundingClientRect()
    return {
      dx: Math.abs(a.left - b.left),
      dy: Math.abs(a.top - b.top),
      dw: Math.abs(a.width - b.width),
      dh: Math.abs(a.height - b.height),
    }
  })
  expect(diff).not.toBeNull()
  for (const value of Object.values(diff!)) expect(value).toBeLessThanOrEqual(1)

  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 12000 })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

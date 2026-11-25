import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { enterHome, openHomeMenu } from './helpers'

test('the cover plays on its own and finishes quickly', async ({ page }) => {
  const started = Date.now()
  await page.goto('/')

  await expect(page.locator('[data-home-intro]')).toBeVisible()
  await expect(page.getByRole('button', { name: /Skip intro/ })).toBeVisible()
  await expect(page.locator('h1[data-hero-lockup]')).toBeHidden()

  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 9000 })
  expect(Date.now() - started).toBeLessThan(7000)
  await expect(page.locator('h1[data-hero-lockup]')).toBeVisible()
  expect(await page.evaluate(() => document.activeElement?.tagName.toLowerCase())).not.toBe(
    'main',
  )
})

test('Skip intro ends the sequence and focuses main', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Skip intro/ }).click()
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 2000 })
  expect(await page.evaluate(() => document.activeElement?.tagName.toLowerCase())).toBe('main')
})

test('the cover plays without a click and keeps the page out of reach', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-home-intro]')).toBeVisible()
  await expect(page.getByRole('button', { name: /Skip intro/ })).toBeVisible()
  await expect(page.locator('h1[data-hero-lockup]')).toBeHidden()
  await expect(page.locator('.skip-link')).toBeHidden()
  await expect(page.getByRole('navigation').getByRole('link').first()).toBeHidden()

  await page.waitForFunction(() => document.documentElement.dataset.intro === 'moving')
  const body = page.locator('[data-hero-intro-body]')

  // ~500 ms into the paragraph, it must be mid-reveal: soft opacity and a
  // still-closing downward mask, not instantly fully opaque.
  await page.waitForTimeout(500)
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
  expect(await page.evaluate(() => document.activeElement?.tagName.toLowerCase())).not.toBe(
    'main',
  )
  await openHomeMenu(page)
  await expect(page.getByRole('navigation').getByRole('link').first()).toBeVisible()
})

test('every full load shows the cover, but a client arrival does not', async ({ page }) => {
  await page.goto('/')
  await enterHome(page)
  await page.reload()
  await expect(page.locator('[data-home-intro]')).toBeVisible()

  await page.goto('/about')
  await page.locator('header .header__brand').click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('[data-home-intro]')).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('the greek intro paragraph stays inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/el')
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-hero-intro-body]')
    if (!(el instanceof HTMLElement)) return false
    const style = getComputedStyle(el)
    return style.display !== 'none' && Number(style.opacity) > 0.5
  })

  const box = await page.locator('[data-hero-intro-body]').boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
})

test('the cover mark assembles from its three layers', async ({ page }) => {
  await page.goto('/')

  const layers = page.locator('[data-home-intro] .intro-mark__layer')
  await expect(layers).toHaveCount(3)
  for (const layer of await layers.all()) {
    expect(await layer.evaluate(el => getComputedStyle(el).animationName)).toContain('intro-mark-in')
  }
})

test('the cover mark stays centred when the paragraph arrives', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const centre = () =>
    page.evaluate(() => {
      const mark = document.querySelector('[data-home-intro] .hero-brand__mark')
      if (!(mark instanceof HTMLElement)) return null
      const rect = mark.getBoundingClientRect()
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    })

  await expect
    .poll(async () => {
      const point = await centre()
      return point === null ? 999 : Math.abs(point.x - 195)
    })
    .toBeLessThanOrEqual(1)

  const before = await centre()
  await page.waitForFunction(() => document.documentElement.dataset.intro === 'moving')
  await page.waitForTimeout(500)
  const moving = await centre()
  await page.waitForTimeout(2400)
  const paragraph = await centre()

  expect(before).not.toBeNull()
  expect(Math.abs(before!.x - 195)).toBeLessThanOrEqual(1)
  expect(Math.abs(moving!.x - before!.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(paragraph!.x - before!.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(paragraph!.y - before!.y)).toBeLessThanOrEqual(1)
})

test('the cover keeps a single mark and never nudges it on click', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/')

    const rect = () =>
      page.evaluate(() => {
        const marks = document.querySelectorAll('[data-home-intro] .hero-brand__mark')
        const mark = marks[0]
        if (!(mark instanceof HTMLElement)) return null
        const box = mark.getBoundingClientRect()
        return {
          count: marks.length,
          ghosts: document.querySelectorAll('[data-intro-ghost]').length,
          x: Math.round(box.left),
          y: Math.round(box.top),
        }
      })

    await expect
      .poll(async () => {
        const value = await rect()
        return value === null ? 999 : value.x
      })
      .toBeGreaterThan(0)

    const before = await rect()
    expect(before).not.toBeNull()
    expect(before!.count).toBe(1)
    expect(before!.ghosts).toBe(0)

    await page.waitForFunction(() => document.documentElement.dataset.intro === 'moving')
    await page.waitForTimeout(500)
    const moving = await rect()
    await page.waitForTimeout(2400)
    const after = await rect()

    expect(moving!.x).toBe(before!.x)
    expect(moving!.y).toBe(before!.y)
    expect(after!.x).toBe(before!.x)
    expect(after!.y).toBe(before!.y)
  }
})

test('the hero stays put while the chrome fades in', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => document.documentElement.dataset.intro === 'revealing')

  const before = await page.locator('[data-hero-lockup]').boundingBox()
  await page.waitForFunction(() => !document.documentElement.dataset.intro, null, { timeout: 5000 })
  const after = await page.locator('[data-hero-lockup]').boundingBox()

  expect(before).not.toBeNull()
  expect(after).not.toBeNull()
  expect(Math.abs(before!.x - after!.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(before!.y - after!.y)).toBeLessThanOrEqual(1)
  await expect(page.locator('.header')).toHaveCSS('opacity', '1')
  await expect(page.locator('.page footer')).toHaveCSS('opacity', '1')
  await expect(page.locator('.home-cover__current')).toHaveCSS('opacity', '1')
})

test('Escape skips the sequence', async ({ page }) => {
  await page.goto('/')
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
  await page.locator('[data-intro-skip]').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 2000 })
  await expect(page.locator('h1[data-hero-lockup]')).toBeVisible()
})

test("the skip link is hidden and tab cannot leave the cover's skip control", async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('[data-home-intro]')).toBeVisible()
  await expect(page.locator('.skip-link')).toBeHidden()

  // The Astro dev toolbar appends its own buttons in dev; remove it so the
  // cover's skip control is the only focusable element, as it is on a built site.
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove())

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
  expect(tabbable).toEqual(['intro__skip t-small'])

  await page.locator('[data-intro-skip]').focus()
  for (const key of ['Tab', 'Tab', 'Shift+Tab']) {
    await page.keyboard.press(key)
    expect(
      await page.evaluate(() => {
        const el = document.activeElement
        return (
          (el instanceof HTMLElement && el.classList.contains('intro__skip')) ||
          el === document.body
        )
      }),
    ).toBe(true)
  }
})

test('the home burger and its panel sit on the left', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await enterHome(page)

  const toggle = page.locator('[data-menu-toggle]')
  const toggleBox = await toggle.boundingBox()
  expect(toggleBox).not.toBeNull()
  expect(toggleBox!.x).toBeLessThan(200)

  await toggle.click()
  const panelBox = await page.locator('#home-menu').boundingBox()
  expect(panelBox).not.toBeNull()
  expect(panelBox!.x).toBeLessThan(200)
})

test('the menu starts with About', async ({ page }) => {
  await page.goto('/')
  await enterHome(page)
  await openHomeMenu(page)

  const hrefs = await page
    .locator('#home-menu .nav__link')
    .evaluateAll(links => links.map(link => link.getAttribute('href')))
  expect(hrefs).toEqual(['/about', '/members', '/projects', '/news', '/contact'])
})

test('the header brand is only hidden on home', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('header .header__brand')).toHaveCount(0)
  await page.goto('/about')
  await expect(page.locator('header .header__brand')).toHaveCount(1)
})

test('the 4s fail-safe waits for slow fonts', async ({ page }) => {
  await page.addInitScript(() => {
    const ready = document.fonts.ready
    let release: () => void = () => {}
    const gate = new Promise<void>(resolve => {
      release = resolve
    })
    Object.defineProperty(document.fonts, 'ready', {
      configurable: true,
      get: () => gate,
    })
    ready.then(() => setTimeout(release, 5000))
  })

  await page.goto('/')
  await page.waitForTimeout(4100)

  expect(await page.evaluate(() => document.documentElement.dataset.intro)).toBe('pending')
  await expect(page.locator('[data-home-intro]')).toBeVisible()
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
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 5000 })
  await expect(page.locator('h1[data-hero-lockup]')).toBeVisible()
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
  await page.clock.fastForward(1000)
  await page.waitForFunction(() => document.documentElement.dataset.intro === 'moving')
  await page.clock.fastForward(15000)
  await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 5000 })
  await expect(page.locator('h1[data-hero-lockup]')).toBeVisible()
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

test('the desktop paragraph clears the tail and stays inside the viewport', async ({
  page,
}) => {
  for (const width of [900, 1280]) {
    await page.setViewportSize({ width, height: 720 })
    await page.goto('/')
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-hero-intro-body]')
      if (!(el instanceof HTMLElement)) return false
      const style = getComputedStyle(el)
      return style.display !== 'none' && Number(style.opacity) > 0.5
    })
    const box = await page.evaluate(() => {
      const el = document.querySelector('[data-hero-intro-body]')
      const tail = document.querySelector('.intro__stage .hero-brand__tail')
      if (!(el instanceof HTMLElement) || !(tail instanceof HTMLElement)) return null
      const b = el.getBoundingClientRect()
      const t = tail.getBoundingClientRect()
      return {
        left: b.left,
        right: b.right,
        top: b.top,
        bottom: b.bottom,
        width: b.width,
        height: b.height,
        tailLeft: t.left,
        tailBottom: t.bottom,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      }
    })
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(0)
    expect(box!.height).toBeGreaterThan(0)
    expect(box!.top).toBeGreaterThanOrEqual(box!.tailBottom)
    expect(box!.left).toBeGreaterThanOrEqual(0)
    expect(box!.right).toBeLessThanOrEqual(box!.viewportWidth)
    expect(box!.top).toBeGreaterThanOrEqual(0)
    expect(box!.bottom).toBeLessThanOrEqual(box!.viewportHeight)
  }
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
  await page.waitForFunction(() => document.documentElement.dataset.intro === 'revealing')

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

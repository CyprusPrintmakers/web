import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { enterHome } from './helpers'

test('the cover waits for a click and keeps the page out of reach', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-home-intro]')).toBeVisible()
  await expect(page.getByRole('button', { name: /Enter the Cyprus/ })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeHidden()
  await expect(page.getByRole('navigation').getByRole('link').first()).toBeHidden()

  await page.getByRole('button', { name: /Enter the Cyprus/ }).click()
  await expect(page.locator('[data-hero-intro-body]')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('[data-hero-intro-body]')).toBeHidden({ timeout: 12000 })
  await expect(page.locator('[data-home-intro]')).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
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
})

test('the cover is keyboard operable', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Enter the Cyprus/ }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-hero-intro-body]')).toBeVisible({ timeout: 5000 })
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
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations).toEqual([])
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

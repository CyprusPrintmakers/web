import { expect, test } from '@playwright/test'
import { openHomeMenu } from './helpers'

test.describe('home ink hero', () => {
  test('stirs the lockup and keeps its state across client navigation', async ({ page }) => {
    const baseURL = String(test.info().project.use.baseURL)
    await page.goto('/about')
    await page.locator('header .header__brand').click()
    await expect(page).toHaveURL(`${baseURL}/`)

    const canvas = page.locator('[data-ink-hero] canvas')
    const brand = page.locator('[data-ink-hero] .hero-brand')
    await expect(canvas).toBeVisible()
    await expect(canvas).toHaveAttribute('data-ready', '1')

    const box = await canvas.boundingBox()
    const lockup = await page.locator('[data-ink-hero]').boundingBox()
    expect(box).not.toBeNull()
    expect(lockup).not.toBeNull()
    expect(box!.height).toBeGreaterThan(lockup!.height * 1.5)
    const x = box!.x + box!.width / 2
    const y = box!.y + box!.height / 2

    await canvas.dispatchEvent('pointerdown', { pointerId: 1, clientX: x, clientY: y, bubbles: true })
    await canvas.dispatchEvent('pointermove', {
      pointerId: 1,
      clientX: x + 30,
      clientY: y + 10,
      bubbles: true,
    })
    await canvas.dispatchEvent('pointerup', { pointerId: 1, bubbles: true })

    await expect
      .poll(async () => Number(await canvas.evaluate(el => getComputedStyle(el).opacity)))
      .toBeGreaterThan(0.01)
    await expect
      .poll(async () => Number(await brand.evaluate(el => getComputedStyle(el).opacity)))
      .toBeLessThan(0.99)

    await openHomeMenu(page)
    await page.getByRole('navigation').getByRole('link', { name: 'ABOUT' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await page.locator('header .header__brand').click()
    await expect(page).toHaveURL(`${baseURL}/`)
    await expect
      .poll(async () =>
        Number(
          await page
            .locator('[data-ink-hero] canvas')
            .evaluate(el => getComputedStyle(el).opacity),
        ),
      )
      .toBeGreaterThan(0.01)
  })

  test('applies the published setting on the next home load', async ({ page }) => {
    const baseURL = String(test.info().project.use.baseURL)
    let enabled = true
    await page.route('**/api/ink', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ enabled }),
      }),
    )

    await page.goto('/about')
    await page.locator('header .header__brand').click()
    await expect(page).toHaveURL(`${baseURL}/`)
    await expect(page.locator('[data-ink-hero]')).toHaveAttribute('data-ink-enabled', '1')
    await expect(page.locator('[data-ink-hero] canvas')).toHaveAttribute('data-ready', '1')

    enabled = false
    await openHomeMenu(page)
    await page.getByRole('navigation').getByRole('link', { name: 'ABOUT' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await page.locator('header .header__brand').click()
    await expect(page).toHaveURL(`${baseURL}/`)
    await expect(page.locator('[data-ink-hero]')).toHaveAttribute('data-ink-enabled', '0')
    await expect(page.locator('[data-ink-hero] canvas')).toHaveCSS('display', 'none')
  })

  test('shows the ink roller on desktop hover', async ({ page }) => {
    const baseURL = String(test.info().project.use.baseURL)
    await page.goto('/about')
    await page.locator('header .header__brand').click()
    await expect(page).toHaveURL(`${baseURL}/`)

    const canvas = page.locator('[data-ink-hero] canvas')
    const roller = page.locator('[data-ink-roller]')
    await expect(canvas).toHaveAttribute('data-ready', '1')
    await expect(roller).toHaveCSS('display', 'block')

    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await expect(roller).toHaveAttribute('data-visible', '1')
    await expect(canvas).toHaveCSS('cursor', 'none')
    await expect(roller).not.toHaveCSS('transform', 'none')

    await page.mouse.down()
    await expect(roller).toHaveAttribute('data-pressing', '1')
    await page.mouse.up()
    await expect(roller).not.toHaveAttribute('data-pressing', '1')

    await page.mouse.move(4, 4)
    await expect(roller).toHaveAttribute('data-visible', '0')
  })

  test('fades the ink out at the canvas edge', async ({ page }) => {
    const baseURL = String(test.info().project.use.baseURL)
    await page.goto('/about')
    await page.locator('header .header__brand').click()
    await expect(page).toHaveURL(`${baseURL}/`)

    const canvas = page.locator('[data-ink-hero] canvas')
    await expect(canvas).toHaveAttribute('data-ready', '1')
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()

    await canvas.dispatchEvent('pointerdown', {
      pointerId: 1,
      clientX: box!.x + box!.width * 0.2,
      clientY: box!.y + box!.height * 0.7,
      bubbles: true,
    })
    for (let step = 1; step <= 20; step += 1) {
      await canvas.dispatchEvent('pointermove', {
        pointerId: 1,
        clientX: box!.x + box!.width * (0.2 + step * 0.03),
        clientY: box!.y + box!.height * (0.7 - step * 0.025),
        bubbles: true,
      })
    }
    await expect
      .poll(async () => Number(await canvas.evaluate(el => getComputedStyle(el).opacity)))
      .toBeGreaterThan(0.5)

    const edge = await canvas.evaluate(element => {
      const surface = element as HTMLCanvasElement
      const context = surface.getContext('2d')
      if (!context) return -1
      const data = context.getImageData(0, 0, surface.width, surface.height).data
      let max = 0
      const check = (x: number, y: number) => {
        max = Math.max(max, data[(y * surface.width + x) * 4 + 3])
      }
      for (let x = 0; x < surface.width; x += 4) {
        check(x, 0)
        check(x, surface.height - 1)
      }
      for (let y = 0; y < surface.height; y += 4) {
        check(0, y)
        check(surface.width - 1, y)
      }
      return max
    })
    expect(edge).toBe(0)

    await canvas.dispatchEvent('pointerup', { pointerId: 1, bubbles: true })
  })

  test('can be switched off with the preview override', async ({ page }) => {
    await page.goto('/?ink=off')
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 2000 })
    const canvas = page.locator('[data-ink-hero] canvas')
    await expect(canvas).toBeHidden()
    await expect(canvas).toHaveAttribute('data-ink-disabled', '1')
    await expect(page.locator('[data-ink-hero] .hero-brand')).toHaveCSS('opacity', '1')
  })

  test('initialises if the cover script fails', async ({ page }) => {
    await page.route('**/scripts/intro.js', route => route.abort())
    await page.goto('/')
    await expect(page.locator('[data-home-intro]')).toBeHidden({ timeout: 8000 })
    await expect(page.locator('[data-ink-hero] canvas')).toHaveAttribute('data-ready', '1')
    await expect(page.locator('[data-ink-hero] .hero-brand')).toHaveCSS('opacity', '1')
  })

  test('stays static with reduced motion', async ({ page }) => {
    const baseURL = String(test.info().project.use.baseURL)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/about')
    await page.locator('header .header__brand').click()
    await expect(page).toHaveURL(`${baseURL}/`)

    await expect(page.locator('[data-ink-hero] .hero-brand')).toHaveCSS('opacity', '1')
    await expect(page.locator('[data-ink-hero] canvas')).toHaveCSS('opacity', '0')
  })
})

test.describe('home ink hero on retina', () => {
  test.use({ deviceScaleFactor: 2 })

  test('renders the ink canvas at device resolution', async ({ page }) => {
    const baseURL = String(test.info().project.use.baseURL)
    await page.goto('/about')
    await page.locator('header .header__brand').click()
    await expect(page).toHaveURL(`${baseURL}/`)

    const canvas = page.locator('[data-ink-hero] canvas')
    await expect(canvas).toHaveAttribute('data-ready', '1')
    const ratio = await canvas.evaluate(element => {
      const surface = element as HTMLCanvasElement
      return surface.width / surface.getBoundingClientRect().width
    })
    expect(ratio).toBeGreaterThan(1.9)
  })
})

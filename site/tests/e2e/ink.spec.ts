import { expect, test } from '@playwright/test'

test.describe('home ink mark', () => {
  test('stirs and keeps its state across client navigation', async ({ page }) => {
    const baseURL = String(test.info().project.use.baseURL)
    await page.goto('/about')
    await page.locator('header .header__brand').click()
    await expect(page).toHaveURL(`${baseURL}/`)

    const canvas = page.locator('[data-ink-mark] canvas')
    const image = page.locator('[data-ink-mark] .ink-mark__image')
    await expect(canvas).toBeVisible()
    await expect(canvas).toHaveAttribute('data-ready', '1')

    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
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
      .poll(async () => Number(await image.evaluate(el => getComputedStyle(el).opacity)))
      .toBeLessThan(0.99)

    await page.getByRole('navigation').getByRole('link', { name: 'ABOUT' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await page.locator('header .header__brand').click()
    await expect(page).toHaveURL(`${baseURL}/`)
    await expect
      .poll(async () =>
        Number(
          await page
            .locator('[data-ink-mark] canvas')
            .evaluate(el => getComputedStyle(el).opacity),
        ),
      )
      .toBeGreaterThan(0.01)
  })

  test('stays static with reduced motion', async ({ page }) => {
    const baseURL = String(test.info().project.use.baseURL)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/about')
    await page.locator('header .header__brand').click()
    await expect(page).toHaveURL(`${baseURL}/`)

    await expect(page.locator('[data-ink-mark] .ink-mark__image')).toHaveCSS('opacity', '1')
    await expect(page.locator('[data-ink-mark] canvas')).toHaveCSS('opacity', '0')
  })
})

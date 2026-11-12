import { expect, type Page } from '@playwright/test'

export async function enterHome(page: Page): Promise<void> {
  const intro = page.locator('[data-home-intro]')
  if ((await intro.count()) === 0 || !(await intro.isVisible())) return
  await intro.getByRole('button').click()
  await expect(intro).toBeHidden({ timeout: 12000 })
}

/** Opens the home burger panel when it is present. */
export async function openHomeMenu(page: Page): Promise<void> {
  const toggle = page.locator('[data-menu-toggle]')
  if ((await toggle.count()) === 0) return
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click()
}

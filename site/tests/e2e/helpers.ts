import { expect, type Page } from '@playwright/test'

export async function enterHome(page: Page): Promise<void> {
  const intro = page.locator('[data-home-intro]')
  if ((await intro.count()) === 0 || !(await intro.isVisible())) return
  await intro.getByRole('button').click()
  await expect(intro).toBeHidden({ timeout: 12000 })
}

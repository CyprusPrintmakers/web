import { expect, test } from '@playwright/test'

test.describe('members index', () => {
  test('shows the committee block and the full directory', async ({ page }) => {
    await page.goto('/members')

    await expect(page.getByRole('heading', { name: /committee/i })).toBeVisible()
    await expect(page.locator('[data-member]')).toHaveCount(3)
    await expect(page.locator('[data-member-count]')).toHaveText('3 members')
  })

  test('filters by first-name letter and updates the count', async ({ page }) => {
    await page.goto('/members')

    await page.getByRole('button', { name: 'M', exact: true }).click()
    await expect(page.locator('[data-member]:not([hidden])')).toHaveCount(1)
    await expect(page.locator('[data-member-count]')).toHaveText('1 member')

    await page.getByRole('button', { name: 'M', exact: true }).click()
    await expect(page.locator('[data-member]:not([hidden])')).toHaveCount(3)
    await expect(page.locator('[data-member-count]')).toHaveText('3 members')
  })

  test('opens a member bio in place with a permalink', async ({ page }) => {
    await page.goto('/members')

    const details = page.locator('#member-georgiou')
    await expect(details).not.toHaveAttribute('open', '')
    await details.locator('summary').click()

    await expect(details).toHaveAttribute('open', '')
    await expect(details.locator('.members__bio')).toBeVisible()
    await expect(details.getByRole('link', { name: /full profile/i })).toHaveAttribute(
      'href',
      '/members/georgiou',
    )
  })

  test('keeps one bio open at a time and toggles with the keyboard', async ({ page }) => {
    await page.goto('/members')

    await page.locator('#member-georgiou summary').click()
    await expect(page.locator('#member-georgiou')).toHaveAttribute('open', '')

    await page.locator('#member-athanasiou summary').click()
    await expect(page.locator('#member-athanasiou')).toHaveAttribute('open', '')
    await expect(page.locator('#member-georgiou')).not.toHaveAttribute('open', '')

    await page.locator('#member-andreas-petrou summary').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#member-andreas-petrou')).toHaveAttribute('open', '')
  })

  test('greek index counts members in greek', async ({ page }) => {
    await page.goto('/el/members')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.locator('[data-member-count]')).toHaveText('3 μέλη')
  })

  test('the full list is in the HTML without JavaScript', async ({ browser }) => {
    const noJs = await browser.newContext({ javaScriptEnabled: false })
    const raw = await noJs.newPage()

    const baseURL = String(test.info().project.use.baseURL)
    await raw.goto(`${baseURL}/members`)
    await expect(raw.locator('[data-member]')).toHaveCount(3)

    await noJs.close()
  })
})

test.describe('member detail', () => {
  test('renders bio, discipline and portrait', async ({ page }) => {
    await page.goto('/members/georgiou')

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Maria Georgiou')
    await expect(page.locator('img').first()).toHaveAttribute('width')
  })

  test('committee entries link to member detail pages', async ({ page }) => {
    await page.goto('/members')

    const link = page.locator('[data-committee] a[href="/members/georgiou"]')
    await expect(link).toBeVisible()
  })

  test('greek detail renders with the greek name', async ({ page }) => {
    await page.goto('/el/members/georgiou')

    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Μαρία Γεωργίου')
  })

  test('english-only members fall back to english prose on greek detail pages', async ({
    page,
  }) => {
    await page.goto('/el/members/andreas-petrou')

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Andreas Petrou')
    await expect(page.locator('main [lang="en"]').first()).toBeVisible()
  })
})

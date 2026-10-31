import { expect, test } from '@playwright/test'

const READER_URL = process.env.E2E_READER_URL || 'https://r.showmine66.com'

test.describe('admin, signed out', () => {
  test('shows the sign-in form', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/ShowMine/)
    await expect(page.locator('input')).toHaveCount(2)
  })

  test('a direct link to a protected page does not reveal it', async ({ page }) => {
    await page.goto('/b/articles')
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('a wrong password is refused and stays on sign-in', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input').first().fill('e2e-nobody@example.invalid')
    await page.locator('input[type="password"]').fill('not-a-real-password')
    await page.keyboard.press('Enter')
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })
})

test.describe('reader', () => {
  test('home page loads', async ({ page }) => {
    const response = await page.goto(READER_URL)
    expect(response?.status()).toBe(200)
  })

  test('an unknown article shows the not available page', async ({ page }) => {
    await page.goto(READER_URL + '/item/e2e-does-not-exist')
    await expect(page.getByText('文章无法访问')).toBeVisible()
  })

  test('an unknown page returns 404', async ({ page }) => {
    const response = await page.goto(READER_URL + '/e2e-no-such-page')
    expect(response?.status()).toBe(404)
  })
})

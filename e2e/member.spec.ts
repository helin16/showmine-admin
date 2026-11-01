import { APIRequestContext, Browser, BrowserContext, expect, Page, test } from '@playwright/test'
import { COMPANY_ID, COMPANY_NAME, signIn } from './support'

const { E2E_MEMBER_EMAIL, E2E_MEMBER_PASSWORD } = process.env

test.describe.configure({ mode: 'serial' })
test.skip(!E2E_MEMBER_EMAIL || !E2E_MEMBER_PASSWORD, 'Needs the optional member login in e2e/.env.local')

let context: BrowserContext
let page: Page
let api: APIRequestContext
let unauthenticatedApi: APIRequestContext

test.beforeAll(async ({ browser }: { browser: Browser }) => {
  ;({ context, page, api, unauthenticatedApi } = await signIn(
    browser,
    E2E_MEMBER_EMAIL as string,
    E2E_MEMBER_PASSWORD as string,
  ))
})

test.afterAll(async () => {
  if (!api) return
  await api.dispose()
  await unauthenticatedApi.dispose()
  await context.close()
})

test('a member cannot change the company or add a channel', async () => {
  // The company's own name, so nothing changes even if this were ever let through.
  const company = await api.put(`/company/${COMPANY_ID}`, { data: { name: COMPANY_NAME } })
  expect([401, 403]).toContain(company.status())
  // A channel needs a name and a script, so this one can't be saved even if it were ever let through.
  const channel = await api.post('/channel', { data: {} })
  expect([401, 403]).toContain(channel.status())
})

test('a member sees no admin menu items', async () => {
  await page.goto('/b/articles')
  await expect(page.locator('a[href="/b/articles"]')).toBeVisible()
  await expect(page.locator('a[href^="/b/company/"], a[href^="/b/super/"]')).toHaveCount(0)
})

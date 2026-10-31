import { APIRequestContext, Browser, BrowserContext, expect, Page, request, test } from '@playwright/test'

const { E2E_EMAIL, E2E_PASSWORD } = process.env
const API_URL = process.env.E2E_API_URL || 'https://i.showmine66.com'
const READER_URL = process.env.E2E_READER_URL || 'https://r.showmine66.com'
const COMPANY_NAME = process.env.E2E_COMPANY_NAME || 'test company'
const COMPANY_ID = process.env.E2E_COMPANY_ID || 'b3f1fdbd-c990-493b-aedc-0f0776badf59'
const PREFIX = 'e2e-'
const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

test.describe.configure({ mode: 'serial' })
test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'Needs the test login in e2e/.env.local')

const runId = `${PREFIX}${Date.now()}`
let context: BrowserContext
let page: Page
let api: APIRequestContext
let unauthenticatedApi: APIRequestContext
let articleId = ''

type Row = { id: string; title?: string; fileName?: string }

const deleteRows = async (path: string, field: 'title' | 'fileName') => {
  const where = encodeURIComponent(JSON.stringify({ isActive: true, [field]: { OP_LIKE: `${PREFIX}%` } }))
  const response = await api.get(`${path}?where=${where}&currentPage=1&perPage=100`)
  expect(response.ok(), `listing ${path} for cleanup`).toBeTruthy()
  const rows: Row[] = (await response.json()).data
  for (const row of rows.filter((item) => `${item[field] || ''}`.startsWith(PREFIX))) {
    expect((await api.delete(`${path}/${row.id}`)).ok(), `deleting ${path}/${row.id}`).toBeTruthy()
  }
  return rows.length
}

test.beforeAll(async ({ browser }: { browser: Browser }) => {
  context = await browser.newContext()
  page = await context.newPage()

  const apiHeaders: Record<string, string> = {}
  page.on('request', (sent) => {
    const appToken = sent.headers()['x-shm-token']
    if (appToken) apiHeaders['X-SHM-TOKEN'] = appToken
  })

  await page.goto('/login')
  await page.getByPlaceholder('Email').fill(E2E_EMAIL as string)
  await page.getByPlaceholder('password').fill(E2E_PASSWORD as string)
  await page.keyboard.press('Enter')
  await page.waitForURL(/\/b\//)

  const companyId = await expect
    .poll(() => page.evaluate(() => localStorage.getItem('comid')), { timeout: 15_000 })
    .toBe(COMPANY_ID)
    .then(() => COMPANY_ID)
  const token = await page.evaluate(() => localStorage.getItem('token'))

  // Every data-changing test depends on this guard, because the suite runs against production.
  api = await request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { ...apiHeaders, Authorization: `Bearer ${token}`, comid: companyId },
  })
  unauthenticatedApi = await request.newContext({ baseURL: API_URL, extraHTTPHeaders: apiHeaders })
  const company = await (await api.get(`/company/${COMPANY_ID}`)).json()
  if (company.name !== COMPANY_NAME) {
    throw new Error(`Refusing to run: active company is not "${COMPANY_NAME}".`)
  }
})

test.afterAll(async () => {
  if (!api) return
  // Runs even after a failure, and also clears anything an earlier crashed run left behind.
  await deleteRows('/item', 'title')
  await deleteRows('/asset', 'fileName')
  expect(await deleteRows('/item', 'title'), 'no test articles should remain').toBe(0)
  expect(await deleteRows('/asset', 'fileName'), 'no test files should remain').toBe(0)
  await api.dispose()
  await unauthenticatedApi.dispose()
  await context.close()
})

test('signing in reaches the back end for the test company', async () => {
  await expect(page).toHaveURL(/\/b\//)
  await expect(page.getByText(COMPANY_NAME, { exact: false }).first()).toBeVisible()
})

test('the article list opens', async () => {
  await page.goto('/b/articles')
  await expect(page.getByRole('button', { name: /new article|新/i }).first()).toBeVisible()
})

test('an article can be created in the editor', async () => {
  await page.goto('/b/articles/new')
  await page.locator('input.inline-input').click()
  await page.keyboard.type(runId)
  await page.getByRole('button', { name: /continue|继续/i }).click()
  await page.waitForURL(/\/b\/articles\/[0-9a-f-]{36}/)
  articleId = page.url().split('/').pop() as string
  await expect(page.locator('body')).toContainText(runId)
})

test('a draft stays hidden from the public', async () => {
  expect((await unauthenticatedApi.get(`/item/${articleId}`)).status()).toBe(404)
  await page.goto(`${READER_URL}/item/${articleId}`)
  await expect(page.getByText('文章无法访问')).toBeVisible()
})

test('a published article appears on the reader', async () => {
  // Sets the date directly: the Publish button can post to connected channels, which cannot be undone.
  const updated = await api.put(`/item/${articleId}`, { data: { publishedAt: new Date(Date.now() - 60_000).toISOString() } })
  expect(updated.ok()).toBeTruthy()
  await page.goto(`${READER_URL}/item/${articleId}`)
  await expect(page.locator('body')).toContainText(runId)
  await expect(page.getByText('文章无法访问')).toHaveCount(0)
})

test('a deleted article disappears from the reader', async () => {
  expect((await api.delete(`/item/${articleId}`)).ok()).toBeTruthy()
  expect((await unauthenticatedApi.get(`/item/${articleId}`)).status()).toBe(404)
})

test('an uploaded file appears in the media library', async () => {
  const fileName = `${runId}.png`
  const uploaded = await api.post('/asset/upload', {
    multipart: { file: { name: fileName, mimeType: 'image/png', buffer: ONE_PIXEL_PNG } },
  })
  expect(uploaded.ok()).toBeTruthy()
  const { url } = await uploaded.json()
  await page.goto('/b/media')
  // The list shows no file names, so the row is identified by its image.
  await expect(page.locator(`.media-list-item img[src="${url}"]`)).toBeVisible()
})

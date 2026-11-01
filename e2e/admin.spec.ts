import { randomUUID } from 'crypto'
import { APIRequestContext, Browser, BrowserContext, expect, Page, test } from '@playwright/test'
import { COMPANY_ID, COMPANY_NAME, PREFIX, READER_URL, signIn } from './support'

const { E2E_EMAIL, E2E_PASSWORD } = process.env
const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)
// A button's icon is part of its name, so these can't be anchored.
const PUBLISH = /publish|发布/i
const CONFIRM_PUBLISH = /yes|是的/i
const FORBIDDEN = 'Sorry, you are not authorized to access this page.'
const WX_SCRIPT = 'https://res.wx.qq.com/open/js/jweixin-1.4.0.js'
const WECHAT_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) MicroMessenger/8.0.50'
// The real SDK only works inside WeChat, so this stands in for it and records what the reader asks of it.
const FAKE_WX = `
  window.wxCalls = {};
  const record = (name) => (options) => { window.wxCalls[name] = options; };
  window.wx = {
    config: record('config'),
    updateAppMessageShareData: record('updateAppMessageShareData'),
    updateTimelineShareData: record('updateTimelineShareData'),
    previewImage: record('previewImage'),
    ready: (run) => run(),
    error: () => {},
  };
`

test.describe.configure({ mode: 'serial' })
test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'Needs the test login in e2e/.env.local')

const runId = `${PREFIX}${Date.now()}`
let context: BrowserContext
let page: Page
let api: APIRequestContext
let unauthenticatedApi: APIRequestContext
let articleId = ''
let uploads: Asset[] = []
let weChat: BrowserContext
let weChatArticle: Row
let isCleanedUp = false

type Row = { id: string; title?: string; fileName?: string }
type Asset = { id: string; url: string }
type WxWindow = { wxCalls?: Record<string, Record<string, unknown>> }

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

const expectNoActiveChannels = async () => {
  const where = encodeURIComponent(JSON.stringify({ isActive: true }))
  const response = await api.get(`/channel?where=${where}&perPage=9999&currentPage=1`)
  expect(response.ok(), 'listing the channels').toBeTruthy()
  const channels: Row[] = (await response.json()).data
  expect(channels, 'the test company must have no active channels: publishing could post to WeChat').toHaveLength(0)
}

const upload = async (fileName: string) => {
  const uploaded = await api.post('/asset/upload', {
    multipart: { file: { name: fileName, mimeType: 'image/png', buffer: ONE_PIXEL_PNG } },
  })
  expect(uploaded.ok()).toBeTruthy()
  return (await uploaded.json()) as Asset
}

const cleanUp = async () => {
  await deleteRows('/item', 'title')
  await deleteRows('/asset', 'fileName')
  expect(await deleteRows('/item', 'title'), 'no test articles should remain').toBe(0)
  expect(await deleteRows('/asset', 'fileName'), 'no test files should remain').toBe(0)
  await expectNoActiveChannels()
  isCleanedUp = true
}

test.beforeAll(async ({ browser }: { browser: Browser }) => {
  ;({ context, page, api, unauthenticatedApi } = await signIn(browser, E2E_EMAIL as string, E2E_PASSWORD as string))
  weChat = await browser.newContext({ userAgent: WECHAT_USER_AGENT })
})

test.afterAll(async () => {
  if (!api) return
  // Runs even after a failure, and also clears anything an earlier crashed run left behind.
  if (!isCleanedUp) await cleanUp()
  await api.dispose()
  await unauthenticatedApi.dispose()
  await context.close()
  await weChat.close()
})

test('signing in reaches the back end for the test company', async () => {
  await expect(page).toHaveURL(/\/b\//)
  await expect(page.getByText(COMPANY_NAME, { exact: false }).first()).toBeVisible()
})

test('the article list opens', async () => {
  await page.goto('/b/articles')
  await expect(page.getByRole('button', { name: /new article|新/i }).first()).toBeVisible()
})

test('the channel pages open for an admin, and the company list is refused', async () => {
  await page.goto('/b/company/channels')
  await expect(page.locator('a[href="/b/company/channels"]')).toBeVisible()
  // Only opens the page: a saved channel would break the publish guard.
  await page.getByRole('button', { name: /new channel|新建渠道/i }).click()
  await expect(page).toHaveURL(/\/b\/company\/channel\/new/)
  await expect(page.getByText(/connecting a new|创建一个新的/i)).toBeVisible()

  await page.goto('/b/super/company/')
  await expect(page.getByText(FORBIDDEN)).toBeVisible()
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

test('pressing Enter creates an article', async () => {
  const title = `${runId}-enter`
  await page.goto('/b/articles/new')
  await page.locator('input.inline-input').click()
  await page.keyboard.type(title)
  await page.keyboard.press('Enter')
  await page.waitForURL(/\/b\/articles\/[0-9a-f-]{36}/)
  await expect(page.locator('body')).toContainText(title)
})

test('a draft stays hidden from the public', async () => {
  expect((await unauthenticatedApi.get(`/item/${articleId}`)).status()).toBe(404)
  await page.goto(`${READER_URL}/item/${articleId}`)
  await expect(page.getByText('文章无法访问')).toBeVisible()
})

test('publishing is disabled when the channels cannot be loaded', async () => {
  const isChannelList = (url: URL) => url.pathname === '/channel'
  await page.route(isChannelList, (route) => route.abort())
  await page.goto(`/b/articles/${articleId}`)
  await page.getByRole('button', { name: PUBLISH }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(dialog.getByRole('button', { name: CONFIRM_PUBLISH })).toBeDisabled()
  await page.unroute(isChannelList)
})

test('the Publish button puts the article on the reader', async () => {
  // Publishing can post to connected channels, which cannot be undone.
  await expectNoActiveChannels()
  await page.goto(`/b/articles/${articleId}`)
  await page.getByRole('button', { name: PUBLISH }).click()
  await page.getByRole('dialog').getByRole('button', { name: CONFIRM_PUBLISH }).click()
  await expect(page.getByRole('button', { name: /re-publish|重新发布/i })).toBeVisible()

  // The publish time comes from this machine's clock, so the API may be a moment behind it.
  await expect(async () => {
    await page.goto(`${READER_URL}/item/${articleId}`)
    await expect(page.getByText('文章无法访问')).toHaveCount(0)
  }).toPass({ timeout: 10_000 })
  await expect(page.locator('body')).toContainText(runId)
})

test('a deleted article disappears from the reader', async () => {
  expect((await api.delete(`/item/${articleId}`)).ok()).toBeTruthy()
  expect((await unauthenticatedApi.get(`/item/${articleId}`)).status()).toBe(404)
})

test('uploaded files appear in the media library, and search filters them by name', async () => {
  const fileName = `${runId}.png`
  uploads = [await upload(fileName), await upload(`${runId}-other.png`)]
  // The list shows no file names, so each row is identified by its image.
  const [found, other] = uploads.map(({ url }) => page.locator(`.media-list-item img[src="${url}"]`))
  await page.goto('/b/media')
  await expect(found).toBeVisible()
  await expect(other).toBeVisible()

  const search = page.getByPlaceholder(/search file name|搜索文件名/i)
  await search.fill(fileName)
  await search.press('Enter')
  await expect(other).toHaveCount(0)
  await expect(found).toBeVisible()
})

test('an English user sees English text and dates', async () => {
  const { user } = await (await api.get('/auth/me')).json()
  test.skip(user.languageCode !== 'en', 'The test user is not set to English')
  await page.goto('/b/media')
  await expect(page.getByPlaceholder('search file name...')).toBeVisible()
  await expect(page.locator('.media-list-item').first()).toContainText(/[A-Z][a-z]{2} \d{1,2}, \d{4}/)
})

test('the API hides channel secrets and refuses another company', async () => {
  // No status filter, so a deleted channel is checked too. With no channels at all this has nothing to check.
  const channels = await api.get('/channel?perPage=9999&currentPage=1')
  expect(channels.ok()).toBeTruthy()
  for (const channel of (await channels.json()).data) {
    expect(channel.settings?.auth).toBeUndefined()
  }

  // A made-up id, so this can't touch a real company. A 400 would mean the access check let it through.
  expect([401, 403]).toContain((await api.put(`/company/${randomUUID()}`, { data: {} })).status())
})

test('the reader shows the five newest articles, and the next page holds the rest', async () => {
  const [cover, other] = uploads
  const image = (url: string) => `<img src="${url}" width="120" height="120">`
  const titles = [0, 1, 2, 3, 4, 5].map((index) => `${runId}-reader-${index}`)
  const created = await Promise.all(
    titles.map((title, index) =>
      api.post('/item', {
        data: {
          title,
          content: `<p>${image(cover.url)}${image(other.url)}</p>`,
          coverAssetId: cover.id,
          enableGTranslateFlag: false,
          // In the past whatever the clocks say, and in a fixed order, newest first.
          publishedAt: new Date(Date.now() - 60_000 - index * 1000).toISOString(),
        },
      }),
    ),
  )
  created.forEach((response) => expect(response.ok()).toBeTruthy())
  weChatArticle = await created[0].json()

  await page.goto(`${READER_URL}/item/${weChatArticle.id}`)
  // The list loads in the browser, so the page is live by now: outside WeChat the script is never added.
  await expect(page.locator('.item-list .title')).toHaveText(titles.slice(0, 5))
  await expect(page.locator(`script[src="${WX_SCRIPT}"]`)).toHaveCount(0)

  // The reader has no control for further pages yet, so the next one is read as it would ask for it.
  const nextPage = await unauthenticatedApi.get('/item?perPage=5&currentPage=2&sort=publishedAt:DESC', {
    headers: { comid: COMPANY_ID },
  })
  expect(nextPage.ok()).toBeTruthy()
  expect((await nextPage.json()).data[0].title).toBe(titles[5])
})

test('inside WeChat an article is signed, shared and previewed', async () => {
  const [cover, other] = uploads
  const { id, title } = weChatArticle
  const conf = await unauthenticatedApi.post('/wechat/js/conf', { data: { url: `${READER_URL}/item/${id}` } })
  expect(conf.ok()).toBeTruthy()
  const signature = expect.stringMatching(/^[0-9a-f]{40}$/)
  expect(await conf.json()).toMatchObject({
    appId: expect.stringMatching(/./),
    timestamp: expect.stringMatching(/./),
    nonceStr: expect.stringMatching(/./),
    signature,
  })

  const reader = await weChat.newPage()
  await reader.route(WX_SCRIPT, (route) => route.fulfill({ contentType: 'text/javascript', body: FAKE_WX }))
  await reader.goto(`${READER_URL}/item/${id}`)
  const wxCall = (name: string) => reader.evaluate((call) => (window as unknown as WxWindow).wxCalls?.[call], name)

  const share = {
    title,
    link: expect.stringContaining(`/item/redirect?itemId=${id}&from=wechat`),
    imgUrl: cover.url.replace('/image/upload/', '/image/upload/w_300/'),
  }
  await expect.poll(() => wxCall('updateAppMessageShareData')).toMatchObject(share)
  await expect.poll(() => wxCall('updateTimelineShareData')).toMatchObject(share)
  expect(await wxCall('config')).toMatchObject({ signature })

  await reader.locator(`#article-content-${id} img`).nth(1).click()
  await expect.poll(() => wxCall('previewImage')).toEqual({ current: other.url, urls: [cover.url, other.url] })
  await reader.close()
})

test('inside WeChat the article still shows when the script is blocked', async () => {
  const reader = await weChat.newPage()
  await reader.route(WX_SCRIPT, (route) => route.abort())
  const blocked = reader.waitForEvent('requestfailed', (failed) => failed.url() === WX_SCRIPT)
  await reader.goto(`${READER_URL}/item/${weChatArticle.id}`)
  await blocked
  await expect(reader.locator('.article-details-wrapper')).toContainText(weChatArticle.title as string)
  await reader.close()
})

// Stays last: the clean-up goes first in case signing out ever ends the token on the server.
test('signing out clears the saved login', async () => {
  await cleanUp()
  await page.goto('/b/articles')
  await page.getByRole('button', { name: 'logout' }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /yes|是/i })
    .click()
  await expect(page.getByPlaceholder('password')).toBeVisible()
  const saved = await page.evaluate(() => [localStorage.getItem('comid'), localStorage.getItem('token')])
  expect(saved).toEqual([null, null])
})

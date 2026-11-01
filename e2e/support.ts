import { Browser, expect, request } from '@playwright/test'

const API_URL = process.env.E2E_API_URL || 'https://i.showmine66.com'
export const READER_URL = process.env.E2E_READER_URL || 'https://r.showmine66.com'
export const COMPANY_NAME = process.env.E2E_COMPANY_NAME || 'test company'
export const COMPANY_ID = process.env.E2E_COMPANY_ID || 'b3f1fdbd-c990-493b-aedc-0f0776badf59'
export const PREFIX = 'e2e-'

export const signIn = async (browser: Browser, email: string, password: string) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  const apiHeaders: Record<string, string> = {}
  page.on('request', (sent) => {
    const appToken = sent.headers()['x-shm-token']
    if (appToken) apiHeaders['X-SHM-TOKEN'] = appToken
  })

  await page.goto('/login')
  await page.getByPlaceholder('Email').fill(email)
  await page.getByPlaceholder('password').fill(password)
  await page.keyboard.press('Enter')
  await page.waitForURL(/\/b\//)

  const companyId = await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem('comid')), { timeout: 15_000 })
    .toBe(COMPANY_ID)
    .then(() => COMPANY_ID)
  const token = await page.evaluate(() => localStorage.getItem('token'))

  // Every data-changing test depends on this guard, because the suite runs against production.
  const api = await request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { ...apiHeaders, Authorization: `Bearer ${token}`, comid: companyId },
  })
  const unauthenticatedApi = await request.newContext({ baseURL: API_URL, extraHTTPHeaders: apiHeaders })
  const company = await (await api.get(`/company/${COMPANY_ID}`)).json()
  if (company.name !== COMPANY_NAME) {
    throw new Error(`Refusing to run: active company is not "${COMPANY_NAME}".`)
  }
  return { context, page, api, unauthenticatedApi }
}

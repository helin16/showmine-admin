import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  retries: 1,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_ADMIN_URL || 'https://admin.showmine.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
})

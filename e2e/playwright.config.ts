import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { defineConfig } from '@playwright/test'

// Loads the untracked test login, without overriding values already set.
const envFile = join(__dirname, '.env.local')
if (existsSync(envFile)) {
  readFileSync(envFile, 'utf8')
    .split('\n')
    .forEach((line) => {
      const separator = line.indexOf('=')
      if (separator > 0 && !line.startsWith('#')) {
        const key = line.slice(0, separator).trim()
        process.env[key] = process.env[key] ?? line.slice(separator + 1).trim()
      }
    })
}

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_ADMIN_URL || 'https://admin.showmine.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
})

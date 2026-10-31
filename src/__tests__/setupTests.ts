import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeEach, vi } from 'vitest'

// Vite loads the real .env into process.env, and tests must never depend on it.
Object.keys(process.env)
  .filter((key) => key.startsWith('REACT_APP_'))
  .forEach((key) => delete process.env[key])

const oldEnv = { ...process.env }

beforeEach(() => {
  process.env = { ...oldEnv }
})

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
  vi.clearAllTimers()
  localStorage.clear()
})

afterAll(() => {
  process.env = oldEnv
})

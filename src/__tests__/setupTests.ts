// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

const oldEnv = { ...process.env }
// beforeAll(async () => {})

beforeEach(async () => {
  process.env = { ...oldEnv }
})

afterEach(() => {
  try {
    jest.resetAllMocks()
    jest.clearAllTimers()
    jest.clearAllMocks()
  } catch (err) {
    console.error(err)
  }
})

afterAll(async () => {
  process.env = oldEnv
})

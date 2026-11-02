import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const { headers } = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'))
const everyPage = headers.find(({ source }: { source: string }) => source === '/(.*)').headers
const value = (name: string) => everyPage.find(({ key }: { key: string }) => key === name)?.value
const policy = () => value('Content-Security-Policy') as string
const directive = (name: string) => policy().split('; ').find((part) => part.startsWith(`${name} `))

describe('security headers', () => {
  test('the content policy is enforced', () => {
    expect(policy()).toBeTruthy()
    expect(value('Content-Security-Policy-Report-Only')).toBeUndefined()
  })

  test('allows what the app loads', () => {
    expect(directive('script-src')).toContain('https://cdn.tiny.cloud')
    expect(directive('script-src')).toContain('https://js.stripe.com')
    expect(directive('script-src')).toContain('https://res.wx.qq.com')
    expect(directive('style-src')).toContain('\'unsafe-inline\'')
    // Articles being edited can embed frames from anywhere, as they can in the reader.
    expect(directive('frame-src')).toBe('frame-src \'self\' https:')
  })

  test('scripts stay locked down', () => {
    expect(directive('script-src')).not.toContain('unsafe-inline')
    expect(directive('script-src')).not.toContain('unsafe-eval')
    expect(directive('object-src')).toBe('object-src \'none\'')
    expect(directive('base-uri')).toBe('base-uri \'self\'')
  })

  test('sends the other protective headers', () => {
    expect(value('X-Content-Type-Options')).toBe('nosniff')
    expect(value('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(value('X-Frame-Options')).toBe('SAMEORIGIN')
  })

  test('keeps the long cache on built assets', () => {
    expect(headers.find(({ source }: { source: string }) => source === '/assets/(.*)').headers[0].value).toContain(
      'immutable',
    )
  })
})

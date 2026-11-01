import { ReactNode } from 'react'
import { vi } from 'vitest'
import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import store, { useAppDispatch } from '../../Redux/makeReduxStore'
import { collapseSideMenu, expandSideMenu } from '../../Redux/reduxers/backendpage.slice'
import Locale from '../../Components/Form/Locale'

test('combines every slice under its key', () => {
  expect(Object.keys(store.getState()).sort()).toEqual(['app', 'auth', 'backendPage', 'weChat'])
})

test('dispatched actions reach their slice only', () => {
  const before = store.getState()
  store.dispatch(collapseSideMenu())
  const after = store.getState()
  expect(after.backendPage.collapsed).toBe(true)
  expect(after.auth).toBe(before.auth)
  store.dispatch(expandSideMenu())
  expect(store.getState().backendPage.collapsed).toBe(false)
})

test('useAppDispatch returns the dispatch of the provided store', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  const { result } = renderHook(() => useAppDispatch(), { wrapper })
  expect(result.current).toBe(store.dispatch)
})

describe('on load', () => {
  const load = async (userAgent: string, language = 'en-US') => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent)
    vi.spyOn(navigator, 'language', 'get').mockReturnValue(language)
    vi.resetModules()
    return (await import('../../Redux/makeReduxStore')).default.getState()
  }

  test.each([
    ['Mozilla/5.0 (iPhone) MicroMessenger/8.0.50', true],
    ['Mozilla/5.0 (Linux; Android 14) micromessenger/8.0', true],
    ['Mozilla/5.0 WebBrowser/1.0', false],
    ['Mozilla/5.0 Chrome/120 Safari/537', false],
    ['', false],
  ])('detects WeChat for "%s": %s', async (userAgent, isInWeChat) => {
    expect((await load(userAgent)).weChat.isInWeChat).toBe(isInWeChat)
  })

  test('uses Chinese inside a Chinese WeChat, since a signed-out user has no saved language', async () => {
    expect((await load('MicroMessenger/8.0', 'zh-CN')).app.locale.locale).toBe(Locale.zhCN.locale)
    expect((await load('MicroMessenger/8.0', 'en-AU')).app.locale.locale).toBe(Locale.enUS.locale)
  })

  test('keeps a normal browser in English, whatever its language', async () => {
    expect((await load('Chrome/120', 'zh-CN')).app.locale.locale).toBe(Locale.enUS.locale)
  })
})

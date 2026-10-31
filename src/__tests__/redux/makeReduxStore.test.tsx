import { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import store, { useAppDispatch } from '../../Redux/makeReduxStore'
import { collapseSideMenu, expandSideMenu } from '../../Redux/reduxers/backendpage.slice'

test('combines every slice under its key', () => {
  expect(Object.keys(store.getState()).sort()).toEqual(['app', 'auth', 'backendPage', 'billingPage', 'weChat'])
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

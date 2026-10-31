import React, { ReactElement } from 'react'
import { configureStore } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { combineReducers } from 'redux'
import AppReducer from '../Redux/reduxers/app.slice'
import AuthReducer from '../Redux/reduxers/auth.slice'
import BackEndPageReducer from '../Redux/reduxers/backendpage.slice'
import BillingPageReducer from '../Redux/reduxers/billingpage.slice'
import WeChatReducer from '../Redux/reduxers/wechat.slice'
import { messages } from '../i18n/messages'

const rootReducer = combineReducers({
  app: AppReducer,
  auth: AuthReducer,
  backendPage: BackEndPageReducer,
  billingPage: BillingPageReducer,
  weChat: WeChatReducer,
})

type RootState = ReturnType<typeof rootReducer>
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }

type RenderOptions = {
  // Merged over each slice's real initial state, one slice at a time.
  state?: DeepPartial<RootState>
  route?: string
}

export const makeTestStore = (state: DeepPartial<RootState> = {}) => {
  const initial = rootReducer(undefined, { type: '@@test/init' })
  const preloadedState = Object.fromEntries(
    Object.entries(initial).map(([key, value]) => [
      key,
      { ...value, ...(state as Record<string, object>)[key] },
    ]),
  ) as RootState
  return configureStore({ reducer: rootReducer, preloadedState })
}

// Renders inside the same providers as App.tsx, with an isolated store and an in-memory router.
export const renderWithProviders = (ui: ReactElement, { state, route = '/' }: RenderOptions = {}) => {
  const store = makeTestStore(state)
  const { locale, componentSize } = store.getState().app
  const result = render(
    <Provider store={store}>
      <ConfigProvider locale={locale} componentSize={componentSize}>
        <IntlProvider locale={locale.locale} messages={messages[locale.locale]}>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </IntlProvider>
      </ConfigProvider>
    </Provider>,
  )
  return { store, ...result }
}

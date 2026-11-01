import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from './Redux/makeReduxStore'
import './App.css'
import Router from './Router'
import { IntlProvider } from 'react-intl'
import { messages } from './i18n/messages'
import { ConfigProvider } from 'antd'
import { changeLanguage } from './i18n/translate'

const App = () => {
  const { locale, componentSize } = useSelector((s: RootState) => s.app)
  // Runs before the children render, so translate() and moment are right on their first render.
  changeLanguage(locale.locale)
  return (
    <ConfigProvider locale={locale} componentSize={componentSize}>
      <IntlProvider locale={locale.locale} messages={messages[locale.locale]}>
        <Router />
      </IntlProvider>
    </ConfigProvider>
  )
}
export default App

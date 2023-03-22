import { createIntl, createIntlCache } from 'react-intl'
import moment from 'moment'
import { messages } from './messages'
import { LOCALES } from '../Constants'
import 'moment/locale/zh-cn'

const cache = createIntlCache()

let int = createIntl(
  {
    locale: LOCALES.ENGLISH,
    messages: messages[LOCALES.ENGLISH],
  },
  cache,
)

export const changeLanguage = (lang: string) => {
  moment.locale(lang)
  const newIntl = createIntl(
    {
      locale: lang,
      messages: messages[lang],
    },
    cache,
  )
  int = newIntl
}

const translate = (id: string, values?: any) => int.formatMessage({ id }, values)

export default translate

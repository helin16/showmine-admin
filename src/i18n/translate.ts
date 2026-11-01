import { createIntl, createIntlCache } from 'react-intl'
import moment from 'moment'
import { messages } from './messages'
import { LOCALES } from '../Constants'
import 'moment/locale/zh-cn'

// Importing a moment locale also selects it, and dates must follow the user's language instead.
moment.locale(LOCALES.ENGLISH)

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

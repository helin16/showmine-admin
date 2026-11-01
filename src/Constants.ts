export const APP_ICON_PATH = '/img/logo-1.png'
export const MIN_PASSWORD_LENGTH = 8
export const LOCAL_STROAGE_KEY_FOR_TOKEN = 'token'
export const REQUEST_HEADER_TOKEN_PREFIX = 'bearer'
export const REQUEST_HEADER_COMPANY_ID = 'comid'
export const REQUEST_HEADER_APP_TOKEN_ID = 'X-SHM-TOKEN'
// The palette of charts 1, which charts 2 changed.
export const CHART_COLORS = ['#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#6F5EF9', '#6DC8EC', '#945FB9', '#FF9845']
export const STYLE_WECHAT_COLOR = 'rgb(123, 179, 46)'
export const weChatBtnStyle = {
  background: STYLE_WECHAT_COLOR,
  borderColor: STYLE_WECHAT_COLOR,
  color: 'white',
}
export const CHANNEL_TYPE_SHOW_MINE = 'Showmine'
export const CHANNEL_TYPE_FACEBOOK = 'Facebook'
export const FACEBOOK_MAIN_COLOR = '#4267B2'
export const CHANNEL_TYPE_GOOGLE = 'Google'
export const GOOGLE_MAIN_COLOR = '#DB4437'
export const CHANNEL_TYPE_TWITTER = 'Twitter'
export const TWITTER_MAIN_COLOR = '#1DA1F2'
export const CHANNEL_TYPE_LINKED_IN = 'LinkedIn'
export const LINKED_IN_MAIN_COLOR = '#0072b1'
export const CHANNEL_TYPE_WORDPRESS = 'WordPress'
export const WORDPRESS_MAIN_COLOR = '#21759b'
export const CHANNEL_SCRIPT_WECHAT_OFFICIAL = 'WeChatOfficial'
export const ADDRESS_ID_VIC = 'e9562f29ec33f9b04b4aaddef754f31c'
export const ITEM_TYPE_ID_ARTICLE = '53c4b055f4b77e56691225d3c6498a26'
export const DATE_TIME_MAX = '9999-12-31T12:59:59.000000Z'

export const LANGUAGE_ID_ENGLISH = '99abc87b2698d636408e2aaa52088976'

export const APP_WIDTHS = {
  xs: '480px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1600px',
}

const Constants = {
  APP_WIDTHS,

  CHANNEL_TYPE_SHOW_MINE,
  CHANNEL_TYPE_FACEBOOK,
  CHANNEL_TYPE_GOOGLE,
  CHANNEL_TYPE_TWITTER,
  CHANNEL_TYPE_LINKED_IN,
  CHANNEL_TYPE_WORDPRESS,
  LOCAL_STROAGE_KEY_FOR_TOKEN,
  REQUEST_HEADER_TOKEN_PREFIX,
  STYLE_WECHAT_COLOR,
  APP_ICON_PATH,

  FACEBOOK_MAIN_COLOR,
  GOOGLE_MAIN_COLOR,
  TWITTER_MAIN_COLOR,
  LINKED_IN_MAIN_COLOR,
  WORDPRESS_MAIN_COLOR,

  ADDRESS_ID_VIC,
  ITEM_TYPE_ID_ARTICLE,
  DATE_TIME_MAX,
}

export const LOCALES = {
  ENGLISH: 'en',
  CHINESE: 'zh-cn',
}

export default Constants

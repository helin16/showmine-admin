import React from 'react'
import {
  FileOutlined,
  CommentOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  PictureOutlined,
  SettingOutlined,
  PartitionOutlined,
  UsergroupAddOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'

import { FormattedMessage } from 'react-intl'
import {
  BACK_END_URL,
  ARTICLE_LIST_URL,
  COMMENTS_LIST_URL,
  MEDIA_LIST_URL,
  COMPANY_ADMIN_URL,
  COMPANY_BILLING_URL,
  COMPANY_USERS_URL,
  COMPANY_CHANNELS_URL,
  COMPANY_LIST_URL,
} from '../../UrlMap'

export const MENU_KEY_DASHBOARD = 'dashboard'
export const MENU_KEY_ARTICLES = 'articles'
export const MENU_KEY_COMMENTS = 'comments'
export const MENU_KEY_MEDIA = 'media'
export const MENU_KEY_COMPANY_ADMIN = 'company-admin'
export const MENU_KEY_COMPANY_BILLING = 'company-billing'
export const MENU_KEY_COMPANY_CHANNELS = 'company-channels'
export const MENU_KEY_COMPANY_USERS = 'company-users'
export const MENU_ACCESS_LEVEL_COMPANY_ADMIN = 'access-company-admin'
export const defaultSelectedKey = MENU_KEY_DASHBOARD
export const MENU_ACCESS_LEVEL_SUPER_ADMIN = 'access-super-admin'
export const MENU_KEY_COMPANY_LIST = 'company-list'

const MenuItems = [
  {
    key: MENU_KEY_DASHBOARD,
    name: <FormattedMessage id='dashboard' />,
    url: BACK_END_URL,
    icon: <DashboardOutlined />,
  },
  {
    name: <FormattedMessage id='component' />,
    items: [
      {
        key: MENU_KEY_ARTICLES,
        name: <FormattedMessage id='news_article' />,
        url: ARTICLE_LIST_URL,
        icon: <FileOutlined />,
      },
      {
        key: MENU_KEY_COMMENTS,
        name: <FormattedMessage id='comment' />,
        url: COMMENTS_LIST_URL,
        icon: <CommentOutlined />,
      },
      {
        key: MENU_KEY_MEDIA,
        name: <FormattedMessage id='media' />,
        url: MEDIA_LIST_URL,
        icon: <PictureOutlined />,
      },
    ],
  },

  {
    name: <FormattedMessage id='my_company' />,
    access: MENU_ACCESS_LEVEL_COMPANY_ADMIN,
    items: [
      {
        key: MENU_KEY_COMPANY_ADMIN,
        name: <FormattedMessage id='company_info' />,
        url: COMPANY_ADMIN_URL,
        icon: <SettingOutlined />,
      },
      {
        key: MENU_KEY_COMPANY_BILLING,
        name: <FormattedMessage id='billing' />,
        url: COMPANY_BILLING_URL,
        icon: <CreditCardOutlined />,
      },
      {
        key: MENU_KEY_COMPANY_CHANNELS,
        name: <FormattedMessage id='channels' />,
        url: COMPANY_CHANNELS_URL,
        icon: <PartitionOutlined />,
      },
      {
        key: MENU_KEY_COMPANY_USERS,
        name: <FormattedMessage id='users' />,
        url: COMPANY_USERS_URL,
        icon: <UsergroupAddOutlined />,
      },
    ],
  },

  {
    name: <FormattedMessage id='super_admin' />,
    access: MENU_ACCESS_LEVEL_SUPER_ADMIN,
    items: [
      {
        key: MENU_KEY_COMPANY_LIST,
        name: <FormattedMessage id='company_list' />,
        url: COMPANY_LIST_URL,
        icon: <UnorderedListOutlined />,
      },
    ],
  },
]

export default MenuItems

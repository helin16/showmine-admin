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
  GlobalOutlined,
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
  COMPANY_WEBSITE_URL,
  COMPANY_WEBSITE_PAGES_URL,
  COMPANY_WEBSITE_TEMPLATES_URL,
  COMPANY_WEBSITE_SETTINGS_URL,
  COMPANY_WEBSITE_LAYOUT_URL,
  COMPANY_WEBSITE_MESSAGES_URL,
} from '../../UrlMap'
import WebsiteMessagesMenuName from '../Website/WebsiteMessagesMenuName'

export const MENU_KEY_DASHBOARD = 'dashboard'
export const MENU_KEY_ARTICLES = 'articles'
export const MENU_KEY_COMMENTS = 'comments'
export const MENU_KEY_MEDIA = 'media'
export const MENU_KEY_COMPANY_ADMIN = 'company-admin'
export const MENU_KEY_COMPANY_BILLING = 'company-billing'
export const MENU_KEY_COMPANY_CHANNELS = 'company-channels'
export const MENU_KEY_COMPANY_USERS = 'company-users'
// The website, under Components (SMN-80): its pages for every member, the rest for its admins. Its page views are on
// the dashboard (SMN-82).
export const MENU_KEY_WEBSITE = 'website'
export const MENU_KEY_WEBSITE_PAGES = 'website-pages'
export const MENU_KEY_WEBSITE_PUBLISH = 'website-publish'
export const MENU_KEY_WEBSITE_TEMPLATES = 'website-templates'
export const MENU_KEY_WEBSITE_SETTINGS = 'website-settings'
export const MENU_KEY_WEBSITE_LAYOUT = 'website-layout'
export const MENU_KEY_WEBSITE_MESSAGES = 'website-messages'
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
      {
        key: MENU_KEY_WEBSITE,
        name: <FormattedMessage id='website' />,
        icon: <GlobalOutlined />,
        // Only for companies a super admin has turned the website builder on for.
        needsWebsiteBuilder: true,
        children: [
          {
            key: MENU_KEY_WEBSITE_PAGES,
            name: <FormattedMessage id='website-menu-pages' />,
            url: COMPANY_WEBSITE_PAGES_URL,
          },
          {
            key: MENU_KEY_WEBSITE_PUBLISH,
            name: <FormattedMessage id='website-menu-publish' />,
            url: COMPANY_WEBSITE_URL,
            adminOnly: true,
          },
          {
            key: MENU_KEY_WEBSITE_LAYOUT,
            name: <FormattedMessage id='website-menu-layout' />,
            url: COMPANY_WEBSITE_LAYOUT_URL,
            adminOnly: true,
          },
          {
            key: MENU_KEY_WEBSITE_MESSAGES,
            name: <WebsiteMessagesMenuName />,
            url: COMPANY_WEBSITE_MESSAGES_URL,
            adminOnly: true,
          },
          {
            key: MENU_KEY_WEBSITE_TEMPLATES,
            name: <FormattedMessage id='website-menu-templates' />,
            url: COMPANY_WEBSITE_TEMPLATES_URL,
            adminOnly: true,
          },
          {
            key: MENU_KEY_WEBSITE_SETTINGS,
            name: <FormattedMessage id='website-settings' />,
            url: COMPANY_WEBSITE_SETTINGS_URL,
            adminOnly: true,
          },
        ],
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

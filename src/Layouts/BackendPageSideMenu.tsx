import React from 'react'
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import MenuItems, { MENU_ACCESS_LEVEL_COMPANY_ADMIN, MENU_ACCESS_LEVEL_SUPER_ADMIN } from '../Components/Menu/MenuItems'
import { RootState } from '../Redux/makeReduxStore'
import Menu from '../Components/Form/Menu'
import { Link } from 'react-router-dom'
import { useIsCompanyAdmin } from '../Components/Route/CompanyAdminRoute'

const SideMenuWrapper = styled.div`
  .ant-menu-item {
    border-radius: 0px !important;
  }
  .group-div {
    font-size: 10px;
    color: rgb(70, 75, 102);
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`
type iMenuEntry = { key: string; name: React.ReactNode; url?: string; icon?: React.ReactNode; adminOnly?: boolean; needsWebsiteBuilder?: boolean; children?: iMenuEntry[] }

const BackendPageSideMenu = () => {
  const { user, company } = useSelector((s: RootState) => s.auth);
  const { selectedMenuKey } = useSelector((s: RootState) => s.backendPage)
  const isCompanyAdmin = useIsCompanyAdmin()

  // An entry with children is a submenu: its admin-only children are left out for members (SMN-80).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toMenuItem = (subItem: iMenuEntry): any =>
    subItem.children
      ? {
          label: subItem.name,
          key: subItem.key,
          icon: subItem.icon,
          children: subItem.children.filter((child) => child.adminOnly !== true || isCompanyAdmin).map(toMenuItem),
        }
      : {
          label: (
            <Link type={'link'} to={`${subItem.url}`}>
              {subItem.name}
            </Link>
          ),
          key: subItem.key,
          icon: subItem.icon,
        }

  // The submenu that holds the selected page starts open.
  const openKeys = MenuItems.flatMap((item) => (item.items || []) as iMenuEntry[])
    .filter((subItem) => (subItem.children || []).some((child) => child.key === selectedMenuKey))
    .map((subItem) => subItem.key)

  const getMenuItems = () => {
    return MenuItems.map((item) => {
      if (isCompanyAdmin !== true && item.access === MENU_ACCESS_LEVEL_COMPANY_ADMIN) {
        return undefined;
      }
      if (user?.isSuperAdmin !== true && item.access === MENU_ACCESS_LEVEL_SUPER_ADMIN) {
        return undefined
      }
      if (!item.items) {
        return {
          label: <Link to={item.url}>{item.name}</Link>,
          key: item.key,
          icon: item.icon,
        }
      }
      return {
        type: 'group',
        label: <div className={'group-div'}>{item.name}</div>,
        key: item.key,
        children: (item.items as iMenuEntry[]).filter((subItem) => subItem.needsWebsiteBuilder !== true || company?.websiteBuilderEnabled === true).map(toMenuItem),
      }
    }).filter((item) => item !== undefined)
  }

  return (
    <SideMenuWrapper>
      <Menu
        theme='dark'
        mode='inline'
        selectedKeys={selectedMenuKey ? [selectedMenuKey] : undefined}
        defaultOpenKeys={openKeys}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        items={getMenuItems()}
      />
    </SideMenuWrapper>
  )
}

export default BackendPageSideMenu

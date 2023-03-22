import { Menu as AntdMenu, MenuProps, MenuItemProps } from 'antd'

export type iMenu = MenuProps
const Menu = ({ className, ...props }: iMenu) => {
  return <AntdMenu {...props} className={`app-Menu ${className || ''}`} />
}

export type iMenuItem = MenuItemProps
export const MenuItem = (props: iMenuItem) => <AntdMenu.Item {...props} />

export default Menu

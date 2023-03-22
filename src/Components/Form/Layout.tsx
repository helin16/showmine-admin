import { Layout as AntdLayout, LayoutProps } from 'antd'
import { SiderProps } from 'antd/es/layout/Sider'
import { BasicProps } from 'antd/es/layout/layout'

type iLayout = LayoutProps
const Layout = ({ className, ...props }: iLayout) => {
  return <AntdLayout {...props} className={`app-Layout ${className || ''}`} />
}

type iSider = SiderProps
export const Sider = ({ className, ...props }: iSider) => {
  return <AntdLayout.Sider {...props} className={`app-Layout-sider ${className || ''}`} />
}

type iContent = BasicProps
export const Content = ({ className, ...props }: iContent) => {
  return <AntdLayout.Content {...props} className={`app-Layout-content ${className || ''}`} />
}

type iFooter = BasicProps
export const Footer = ({ className, ...props }: iFooter) => {
  return <AntdLayout.Footer {...props} className={`app-Layout-footer ${className || ''}`} />
}

type iHeader = BasicProps
export const Header = ({ className, ...props }: iHeader) => {
  return <AntdLayout.Header {...props} className={`app-Layout-header ${className || ''}`} />
}

export default Layout

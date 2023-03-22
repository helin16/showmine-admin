import { Dropdown as AntdDropdown, DropdownProps } from 'antd'

type iDropdown = DropdownProps
const Dropdown = ({ className, ...props }: iDropdown) => {
  return <AntdDropdown {...props} className={`app-Dropdown ${className || ''}`} />
}

export default Dropdown

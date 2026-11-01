import { Dropdown as AntdDropdown, DropdownProps } from 'antd'

type iDropdown = DropdownProps
const Dropdown = ({ className, ...props }: iDropdown) => {
  return <AntdDropdown {...props} rootClassName={`app-Dropdown ${className || ''}`} />
}

export default Dropdown

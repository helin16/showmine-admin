import { Popover as AntdPopover, PopoverProps } from 'antd'

type iPopover = PopoverProps
const Popover = ({ className, ...props }: iPopover) => {
  return <AntdPopover {...props} rootClassName={`app-Popover ${className || ''}`} />
}

export default Popover

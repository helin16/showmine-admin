import { Tooltip as AntdTooltip, TooltipProps } from 'antd'

type iTooltip = TooltipProps
const Tooltip = ({ className, ...props }: iTooltip) => {
  return <AntdTooltip {...props} className={`app-Tooltip ${className || ''}`} />
}

export default Tooltip

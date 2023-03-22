import { Line as AntdLine, LineConfig } from '@ant-design/charts'

type iLine = LineConfig
const Line = ({ className, ...props }: iLine) => {
  return <AntdLine {...props} className={`app-chart-Line ${className || ''}`} />
}

export default Line

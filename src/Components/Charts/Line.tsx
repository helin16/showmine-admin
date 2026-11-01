import { Line as AntdLine, LineConfig } from '@ant-design/charts'
import { CHART_COLORS } from '../../Constants'

type iLine = LineConfig
const Line = ({ className, ...props }: iLine) => {
  return (
    <AntdLine
      height={400}
      point={{ sizeField: 2 }}
      scale={{ color: { range: CHART_COLORS }, y: { domainMin: 0, nice: true } }}
      axis={{ x: { labelAutoRotate: false, labelAutoHide: true } }}
      legend={{ color: { position: 'top', title: false, layout: { justifyContent: 'center' } } }}
      {...props}
      className={`app-chart-Line ${className || ''}`}
    />
  )
}

export default Line

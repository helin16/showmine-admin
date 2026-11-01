import { Pie as AntdDonut, PieConfig } from '@ant-design/charts'
import { CHART_COLORS } from '../../Constants'
import MathHelper from '../../Helpers/MathHelper'

type iDonut = PieConfig & {
  radius: number
  innerRadius?: number
}
const Donut = ({ className, radius, innerRadius, ...props }: iDonut) => {
  const total = (props.data as { value: number }[]).reduce((sum, row) => MathHelper.add(sum, row.value), 0)
  return (
    <AntdDonut
      label={{ text: 'value', position: 'inside', fill: 'white' }}
      height={400}
      scale={{ color: { range: CHART_COLORS } }}
      legend={{
        color: {
          position: 'right',
          title: false,
          size: 90,
          itemMarker: 'circle',
          layout: { justifyContent: 'center' },
        },
      }}
      annotations={[
        { type: 'text', style: { text: 'Total', x: '50%', y: '48%', textAlign: 'center', fontSize: 20 } },
        {
          type: 'text',
          style: { text: `${total}`, x: '50%', y: '54%', textAlign: 'center', fontSize: 32, fontWeight: 'bold' },
        },
      ]}
      {...props}
      className={`app-chart-donut ${className || ''}`}
      radius={radius}
      innerRadius={innerRadius ? innerRadius : MathHelper.sub(radius, 0.2)}
    />
  )
}

export default Donut

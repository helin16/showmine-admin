import {Pie as AntdDonut, PieConfig} from '@ant-design/charts';
import MathHelper from '../../Helpers/MathHelper';

type iDonut = PieConfig & {
  radius: number;
  innerRadius?: number;
};
const Donut = ({className, radius, innerRadius, ...props}: iDonut) => {
  return (
    <AntdDonut
      {...props}
      className={`app-chart-donut ${className || ''}`}
      radius={radius}
      innerRadius={innerRadius ? innerRadius : MathHelper.sub(radius, 0.2)}
    />
  );
};

export default Donut;

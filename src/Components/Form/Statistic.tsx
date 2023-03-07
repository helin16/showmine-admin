import {Statistic as AntdStatistic, StatisticProps} from 'antd';

type iStatistic = StatisticProps;
const Statistic = ({className, ...props}: iStatistic) => {
  return <AntdStatistic {...props} className={`app-Statistic ${className || ''}`} />;
};

export default Statistic;

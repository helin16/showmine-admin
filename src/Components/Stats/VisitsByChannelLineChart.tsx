import React from 'react';
import IStatsItem from '../../Types/Stats/IStatsItem';
import Utils from '../../Services/Utils';
import EmptyStats from './EmptyStats';
import Line from '../Charts/Line';

// const title = 'Trend Per Channel';
const VisitsByChannelLineChart = ({ items, title = 'Trend Per Channel' }: {items: IStatsItem[], title: string}) => {
  const itemArr = items.map((item: IStatsItem) => ({
    ...item,
    type: Utils.translateChannelType(item.from),
  }));
  /**
   *
   */
  const config = {
    forceFit: true,
    title: {
      visible: true,
      text: title,
    },
    description: {
      visible: false,
      text: '',
    },
    legend: {
      visible: true,
      flipPage: true,
    },
    data: JSON.parse(JSON.stringify(itemArr)),
    xField: 'date',
    yField: 'total',
    seriesField: 'type',
    responsive: true,
  };
  if (items.length === 0) {
    return <EmptyStats title={title} />;
  }
  return <Line {...config} />;
};

export default VisitsByChannelLineChart;

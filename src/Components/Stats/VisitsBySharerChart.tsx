import React from 'react'
import IUser from '../../Types/User/IUser'
import EmptyStats from './EmptyStats'
import Donut from '../Charts/Donut'

const VisitsBySharerChart = () => {
  return null
  // const translateType = (sharer: IUser | null) => {
  //   if (sharer === null) {
  //     return 'Unknown';
  //   }
  //   return sharer.nick_name;
  // };
  //
  // const data = items.filter((item: IStatsItem) => item.sharer !== null)
  //   .sort((item1: IStatsItem, item2: IStatsItem) => item2.total - item1.total)
  //   .map((item: IStatsItem) => ({ type: translateType(item.sharer), value: item.total }));
  //
  // const config = {
  //   forceFit: true,
  //   title: {
  //     visible: true,
  //     text: title,
  //   },
  //   description: {
  //     visible: false,
  //     text: '',
  //   },
  //   legend: {
  //     visible: true,
  //     flipPage: true,
  //   },
  //   radius: 0.8,
  //   data,
  //   angleField: 'value',
  //   colorField: 'type',
  //   label: {
  //     visible: true,
  //     type: 'inner',
  //   },
  // };
  // if (data.length === 0) {
  //   return <EmptyStats title={title} />;
  // }
  // return <Donut {...config} />;
}

export default VisitsBySharerChart

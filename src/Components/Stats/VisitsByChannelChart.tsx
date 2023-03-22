import React, {useEffect, useState} from 'react'
// import IStatsItem from '../../Types/Stats/IStatsItem';
import Utils from '../../Services/Utils'
import EmptyStats from './EmptyStats'
import Donut from '../Charts/Donut'
import IItemVisit from '../../Types/Article/IItemVisit';
import MathHelper from '../../Helpers/MathHelper';

type iVisitsByChannelChart = {
  title?: string;
  itemVisits: IItemVisit[];
}
type iMap = {[key: string]: number};
const VisitsByChannelChart = ({title, itemVisits}: iVisitsByChannelChart) => {
  const[visitsMap, setVisitsMap] = useState<iMap>({});

  useEffect(() => {
    setVisitsMap(
      itemVisits.reduce((map: iMap, itemVisit) => {
        const channelName = `${itemVisit.source || ''}`.trim().toUpperCase();
        return {
          ...map,
          [channelName]: MathHelper.add(map[channelName] || 0, 1)
        }
      }, {})
    )
  }, [itemVisits]);

  const getData = () => Object.keys(visitsMap).map((type) => ({ type: Utils.translateChannelType(type), value: visitsMap[type] }));
  const getConfig = () => ({
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
    radius: 0.8,
    data: getData(),
    angleField: 'value',
    colorField: 'type',
    label: {
      visible: true,
      type: 'inner',
    },
  });

  if (getData().length === 0) {
    return (<EmptyStats title={title || ''} />);
  }
  return <Donut {...getConfig()} />;
}

export default VisitsByChannelChart

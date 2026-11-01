import React, {useEffect, useState} from 'react'
import Utils from '../../Services/Utils'
import EmptyStats from './EmptyStats'
import Line from '../Charts/Line'
import IItemVisit from '../../Types/Article/IItemVisit';
import MathHelper from '../../Helpers/MathHelper';
import moment from 'moment';

type iVisitsByChannelLineChart = {
  title?: string;
  itemVisits: IItemVisit[];
  itemsOverDays: number;
}
type iMap = {[key: string]: {[key: string]: number}};
const VisitsByChannelLineChart = ({title, itemVisits, itemsOverDays}: iVisitsByChannelLineChart) => {
  const[visitsMap, setVisitsMap] = useState<iMap>({});

  useEffect(() => {
    setVisitsMap(
      itemVisits.reduce((map: iMap, itemVisit) => {
        const channelName = `${itemVisit.source || ''}`.trim().toUpperCase();
        const date = moment(itemVisit.createdAt).format(`${itemsOverDays <= 1 ? 'H': 'll'}`);
        return {
          ...map,
          [channelName]: {
            ...(map[channelName] || {}),
            [date]: MathHelper.add(!(channelName in map) ? 0 : (map[channelName][date] || 0), 1)
          }
        }
      }, {})
    )
  }, [itemVisits]);


  const getData = () => Object.keys(visitsMap).reduce((arr: any[], type) => {
    return [
      ...arr,
      ...Object.keys(visitsMap[type]).map(date => ({date, total: visitsMap[type][date], type: Utils.translateChannelType(type)})),
    ]
  }, []);
  const getConfig = () => ({
    data: getData(),
    xField: 'date',
    yField: 'total',
    colorField: 'type',
  });

  if (getData().length === 0) {
    return <EmptyStats title={title || ''} />;
  }
  return <Line {...getConfig()} />;
}

export default VisitsByChannelLineChart

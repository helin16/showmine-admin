import React, {useEffect, useState} from 'react'
import IUser from '../../Types/User/IUser'
import EmptyStats from './EmptyStats'
import Donut from '../Charts/Donut'
import IItemVisit from '../../Types/Article/IItemVisit';
import MathHelper from '../../Helpers/MathHelper';

type iVisitsBySharerChart = {
  title?: string;
  itemVisits: IItemVisit[];
}
type iMap = {[key: string]: number};
const VisitsBySharerChart = ({title, itemVisits}: iVisitsBySharerChart) => {
  const[visitsMap, setVisitsMap] = useState<iMap>({});

  useEffect(() => {
    const translateType = (sharer?: IUser) => {
      if (!sharer) {
        return 'Unknown';
      }
      return sharer.nickName;
    };

    setVisitsMap(
      itemVisits.reduce((map: iMap, itemVisit) => {
        const sharerName = translateType(itemVisit.SharedBy);
        return {
          ...map,
          [sharerName]: MathHelper.add(map[sharerName] || 0, 1)
        }
      }, {})
    )
  }, [itemVisits]);



  const data = Object.keys(visitsMap)
    .map((key) => ({ type: key, value: visitsMap[key] }));

  const config = {
    radius: 0.8,
    data,
    angleField: 'value',
    colorField: 'type',
  };
  if (data.length === 0) {
    return <EmptyStats title={title || ''} />;
  }
  return <Donut {...config} />;
}

export default VisitsBySharerChart

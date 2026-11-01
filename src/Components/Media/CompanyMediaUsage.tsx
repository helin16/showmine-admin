import React, { useEffect, useState } from 'react'
import { PieChartOutlined } from '@ant-design/icons'
import { useIntl } from 'react-intl'
import AssetService from '../../Services/AssetService'
import { MEDIA_LIST_URL } from '../../UrlMap'
import UsageWrapperLink from '../Stats/UsageWrapperLink'
import Statistic from '../Form/Statistic'
import message from '../Form/message';
import Spin from '../Form/Spin';
import Utils from '../../Services/Utils'

const CompanyMediaUsage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState({
    realValue: 0,
    maxValue: -1,
  });
  const intl = useIntl()
  /**
   *
   */
  useEffect(() => {
    let isCanceled = false;
    setIsLoading(true);
    AssetService.getAll({
      where: JSON.stringify({isActive: true}),
      perPage: 1,
      currentPage: 1,
    })
      .then(resp => {
        setState({
          ...state,
          realValue: resp.total,
        });
      })
      .catch(err => {
        message.error(Utils.getErrorMessage(err));
      })
      .finally(() => {
        setIsLoading(false);
      })
    return () => {
      isCanceled = true;
    }
  }, []);
  /**
   *
   */
  return (
    <UsageWrapperLink
      currentValue={AssetService.formatFileSize(state.realValue).join(' ')}
      planValue={AssetService.formatFileSize(state.maxValue, 0).join(' ')}
      url={MEDIA_LIST_URL}
    >
      <Spin spinning={isLoading}>
        <Statistic title={intl.formatMessage({ id: 'storage' })}
          prefix={<PieChartOutlined />}
          value={AssetService.formatFileSize(state.realValue).join(' ')}
          suffix={`/ ${state.maxValue < 0 ? intl.formatMessage({ id: 'unlimited' }) : AssetService.formatFileSize(state.maxValue, 0).join(' ')}`} />
      </Spin>
    </UsageWrapperLink>
  );
}

export default CompanyMediaUsage

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useIntl } from 'react-intl'
import { RootState } from '../../Redux/makeReduxStore'
import UsageWrapperLink from '../Stats/UsageWrapperLink'
import Icons from '../Icons'
import Statistic from '../Form/Statistic'
import message from '../Form/message';
import Spin from '../Form/Spin';
import ChannelService from '../../Services/ChannelService';
import {COMPANY_CHANNELS_URL} from '../../UrlMap';
import Utils from '../../Services/Utils'

const CompanyChannelStats = () => {
  const { user } = useSelector((s: RootState) => s.auth)
  const [state, setState] = useState({ realValue: 0, maxValue: -1 })
  const [isLoading, setIsLoading] = useState(false);
  const intl = useIntl()
  /**
   *
   */
  useEffect(() => {
    let isCanceled = false;
    setIsLoading(true);
    ChannelService.getAll({
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


  return (
    <UsageWrapperLink
      currentValue={state.realValue}
      planValue={state.maxValue}
      url={user?.isSuperAdmin === true ? COMPANY_CHANNELS_URL : undefined}
    >
      <Spin spinning={isLoading}>
        <Statistic
          title={intl.formatMessage({ id: 'channels' })}
          prefix={<Icons.ApiOutlined />}
          value={state.realValue}
          suffix={`/ ${state.maxValue < 0 ? intl.formatMessage({ id: 'unlimited' }) : state.maxValue}`}
        />
      </Spin>
    </UsageWrapperLink>
  )
}

export default CompanyChannelStats

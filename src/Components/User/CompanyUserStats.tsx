import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useIntl } from 'react-intl'
import { RootState } from '../../Redux/makeReduxStore'
import UsageWrapperLink from '../Stats/UsageWrapperLink'
import { COMPANY_USERS_URL } from '../../UrlMap'
import Icons from '../Icons'
import Statistic from '../Form/Statistic'
import message from '../Form/message';
import CompanyUserService from '../../Services/CompanyUserService';
import Spin from '../Form/Spin';

const CompanyUserStats = () => {
  const { user } = useSelector((s: RootState) => s.auth)
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
    CompanyUserService.getAll({
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
        message.error(err.response.data.message);
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
      currentValue={state.realValue}
      planValue={state.maxValue}
      url={user?.isSuperAdmin === true ? COMPANY_USERS_URL : undefined}
    >
      <Spin spinning={isLoading}>
        <Statistic title={intl.formatMessage({ id: 'users' })}
           prefix={<Icons.UserOutlined />}
           value={state.realValue}
           suffix={`/ ${state.maxValue < 0 ? intl.formatMessage({ id: 'unlimited' }) : state.maxValue}`}
        />
      </Spin>
    </UsageWrapperLink>
  );
}

export default CompanyUserStats

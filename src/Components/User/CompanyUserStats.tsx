import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useIntl } from 'react-intl'
import { RootState } from '../../Redux/makeReduxStore'
import UsageWrapperLink from '../Stats/UsageWrapperLink'
import { COMPANY_USERS_URL } from '../../UrlMap'
import CompanyService from '../../Services/CompanyService'
import Icons from '../Icons'
import Statistic from '../Form/Statistic'

const CompanyUserStats = () => {
  return null
  // const { user, company, companyPackage } = useSelector((s: RootState) => s.auth);
  // const [state, setState] = useState({
  //   realValue: 0,
  //   maxValue: 0,
  // });
  // const intl = useIntl();
  // /**
  //  *
  //  */
  // useEffect(() => {
  //   if (!companyPackage) return;
  //   setState({
  //     realValue: companyPackage.validate_result[PACKAGE_ITEM_TYPES.USER].real_num,
  //     maxValue: companyPackage.validate_result[PACKAGE_ITEM_TYPES.USER].max_num,
  //   });
  // }, [companyPackage]);
  // /**
  //  *
  //  */
  // return (
  //   <UsageWrapperLink
  //     currentValue={state.realValue}
  //     planValue={state.maxValue}
  //     url={CompanyService.isUserCompanyAdmin(user, company) ? COMPANY_USERS_URL : undefined}
  //   >
  //     <Statistic title={intl.formatMessage({ id: 'users' })}
  //        prefix={<Icons.UserOutlined />}
  //        value={state.realValue}
  //        suffix={`/ ${state.maxValue < 0 ? intl.formatMessage({ id: 'unlimited' }) : state.maxValue}`}
  //     />
  //   </UsageWrapperLink>
  // );
}

export default CompanyUserStats

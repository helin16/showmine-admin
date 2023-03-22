import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useIntl } from 'react-intl'
import { RootState } from '../../Redux/makeReduxStore'
import UsageWrapperLink from '../Stats/UsageWrapperLink'
import Icons from '../Icons'
import Statistic from '../Form/Statistic'

const CompanyChannelStats = () => {
  const { user, company } = useSelector((s: RootState) => s.auth)
  const [state, setState] = useState({ realValue: 0, maxValue: 0, isCompanyAdmin: false })
  const intl = useIntl()

  /**
   *
   */
  useEffect(() => {
    setState((s) => ({
      ...s,
      // realValue: companyPackage.validate_result[PACKAGE_ITEM_TYPES.CHANNEL].real_num,
      // maxValue: companyPackage.validate_result[PACKAGE_ITEM_TYPES.CHANNEL].max_num,
      realValue: 1,
      maxValue: -1,
    }))
  }, [])

  return (
    <UsageWrapperLink currentValue={state.realValue} planValue={state.maxValue}>
      <Statistic
        title={intl.formatMessage({ id: 'channels' })}
        prefix={<Icons.ApiOutlined />}
        value={state.realValue}
        suffix={`/ ${state.maxValue < 0 ? intl.formatMessage({ id: 'unlimited' }) : state.maxValue}`}
      />
    </UsageWrapperLink>
  )
}

export default CompanyChannelStats

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useIntl } from 'react-intl'
import { RootState } from '../../Redux/makeReduxStore'
import { ARTICLE_LIST_URL } from '../../UrlMap'
import UsageWrapperLink from '../Stats/UsageWrapperLink'
import Statistic from '../Form/Statistic'
import Icons from '../Icons'

const CompanyArticleStats = () => {
  // const { companyPackage } = useSelector((s: RootState) => s.auth);
  const [state, setState] = useState({
    realValue: 0,
    maxValue: 0,
  })
  const intl = useIntl()
  /**
   *
   */
  useEffect(() => {
    // if (!companyPackage) return;
    setState({
      realValue: 0,
      maxValue: -1,
    })
  }, [])
  /**
   *
   */
  return (
    <UsageWrapperLink currentValue={state.realValue} planValue={state.maxValue} url={ARTICLE_LIST_URL}>
      <Statistic
        title={intl.formatMessage({ id: 'articles' })}
        prefix={<Icons.AuditOutlined />}
        value={state.realValue}
        suffix={`/ ${state.maxValue < 0 ? intl.formatMessage({ id: 'unlimited' }) : state.maxValue}`}
      />
    </UsageWrapperLink>
  )
}

export default CompanyArticleStats

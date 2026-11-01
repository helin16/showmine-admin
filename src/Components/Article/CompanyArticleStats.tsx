import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { ARTICLE_LIST_URL } from '../../UrlMap'
import UsageWrapperLink from '../Stats/UsageWrapperLink'
import Statistic from '../Form/Statistic'
import Icons from '../Icons'
import Spin from '../Form/Spin';
import ArticleService from '../../Services/ArticleService';
import message from '../Form/message';
import Utils from '../../Services/Utils'

const initState = {
  realValue: 0,
  maxValue: -1,
};
const CompanyArticleStats = () => {
  const [state, setState] = useState(initState)
  const [isLoading, setIsLoading] = useState(false);
  const intl = useIntl()
  /**
   *
   */
  useEffect(() => {
    let isCanceled = false;
    setIsLoading(true);
    ArticleService.getAll({
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
    <UsageWrapperLink currentValue={state.realValue} planValue={state.maxValue} url={ARTICLE_LIST_URL}>
      <Spin spinning={isLoading}>
        <Statistic
          title={intl.formatMessage({ id: 'articles' })}
          prefix={<Icons.AuditOutlined />}
          value={state.realValue}
          suffix={`/ ${state.maxValue < 0 ? intl.formatMessage({ id: 'unlimited' }) : state.maxValue}`}
        />
      </Spin>
    </UsageWrapperLink>
  )
}

export default CompanyArticleStats

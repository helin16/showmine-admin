import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { RootState } from '../../Redux/makeReduxStore';
import { PACKAGE_ITEM_TYPES } from '../../Types/Package/IPackage';
import { ARTICLE_LIST_URL } from '../../UrlMap';
import UsageWrapperLink from '../Stats/UsageWrapperLink';
import Statistic from '../Form/Statistic';
import Icons from '../Icons';

const CompanyArticleStats = () => {
  const { companyPackage } = useSelector((s: RootState) => s.auth);
  const [state, setState] = useState({
    realValue: 0,
    maxValue: 0,
  });
  const intl = useIntl();
  /**
   *
   */
  useEffect(() => {
    if (!companyPackage) return;
    setState({
      realValue: companyPackage.validate_result[PACKAGE_ITEM_TYPES.ITEM].real_num,
      maxValue: companyPackage.validate_result[PACKAGE_ITEM_TYPES.ITEM].max_num,
    });
  }, [companyPackage]);
  /**
   *
   */
  return (
    <UsageWrapperLink
      currentValue={state.realValue}
      planValue={state.maxValue}
      url={ARTICLE_LIST_URL}
    >
      <Statistic title={intl.formatMessage({ id: 'articles' })}
         prefix={<Icons.AuditOutlined />}
         value={state.realValue}
         suffix={`/ ${state.maxValue < 0 ? intl.formatMessage({ id: 'unlimited' }) : state.maxValue}`} />
    </UsageWrapperLink>
  );
};

export default CompanyArticleStats;

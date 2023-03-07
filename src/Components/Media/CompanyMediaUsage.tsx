import React, { useEffect, useState } from 'react';
import { Statistic } from 'antd';
import { useSelector } from 'react-redux';
import { PieChartOutlined } from '@ant-design/icons';
import { useIntl } from 'react-intl';
import AssetService from '../../Services/AssetService';
import { RootState } from '../../Redux/makeReduxStore';
import {PACKAGE_ITEM_TYPES} from '../../Types/Package/IPackage';
import { MEDIA_LIST_URL } from '../../UrlMap';
import UsageWrapperLink from '../Stats/UsageWrapperLink';

const CompanyMediaUsage = () => {
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
      realValue: companyPackage.validate_result[PACKAGE_ITEM_TYPES.STORAGE].real_num,
      maxValue: companyPackage.validate_result[PACKAGE_ITEM_TYPES.STORAGE].max_num,
    });
  }, [companyPackage]);
  /**
   *
   */
  return (
    <UsageWrapperLink
      currentValue={AssetService.formatFileSize(state.realValue).join(' ')}
      planValue={AssetService.formatFileSize(state.maxValue, 0).join(' ')}
      url={MEDIA_LIST_URL}
    >
      <Statistic title={intl.formatMessage({ id: 'storage' })}
        prefix={<PieChartOutlined />}
        value={AssetService.formatFileSize(state.realValue).join(' ')}
        suffix={`/ ${state.maxValue < 0 ? 'Unlimited' : AssetService.formatFileSize(state.maxValue, 0).join(' ')}`} />
    </UsageWrapperLink>
  );
};

export default CompanyMediaUsage;

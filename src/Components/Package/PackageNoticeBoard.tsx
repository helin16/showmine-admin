import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useIntl, FormattedMessage } from 'react-intl';
import { RootState } from '../../Redux/makeReduxStore';
import { contentInternalPadding } from '../../Styles/AppWrapper';
import CompanyService from '../../Services/CompanyService';
import { COMPANY_BILLING_URL } from '../../UrlMap';
import { initialPackageItem } from '../../Types/Package/IPackage';
import PackageService from '../../Services/PackageService';
import translate from '../../i18n/translate';
import Alert from '../Form/Alert';
import {Link} from 'react-router-dom';

const PackageNoticeBoardWrapper = styled.div`
  .message-content {
    margin-bottom: ${contentInternalPadding};
  }
`;
type iState = {
  show: boolean,
  invalidItems: any[], // eslint-disable-line
}

const initialState: iState = {
  show: false,
  invalidItems: [],
};

const PackageNoticeBoard = () => {
  const [state, setState] = useState(initialState);
  const { user, company, companyPackage } = useSelector(
    (s: RootState) => s.auth,
  );
  const { locale } = useSelector((s: RootState) => s.app);
  const intl = useIntl();

  useEffect(() => {
    const invalidItems = (!companyPackage || !companyPackage.validate_result) ? []
      : Object.keys(companyPackage.validate_result)
        .filter((keyName) => {
          // @ts-ignore
          if (!companyPackage.validate_result[keyName]) return true;
          // @ts-ignore
          if(!companyPackage.validate_result[keyName].is_valid) return true; // eslint-disable-line
          // @ts-ignore
          if(companyPackage.validate_result[keyName].is_valid !== true) return true; // eslint-disable-line
          return false;
        })
        .map((key) => {
          // @ts-ignore
          const limitObj = companyPackage.validate_result[key];
          return {
            ...limitObj,
            name: key,
            error: (<span key={key}>
                {
                  // @ts-ignore
                  PackageService.getPackageItemName({ ...initialPackageItem, name: key })
                }
                {translate('package-notice', { num1: limitObj.max_num, num2: limitObj.real_num })}
            </span>),
          };
        });
    const needToShow = (companyPackage === null
      || (companyPackage && companyPackage.is_valid !== true)
      || invalidItems.length > 0
    );

    setState((s) => ({
      ...s,
      show: needToShow || false,
      invalidItems,
    }));
  }, [companyPackage, locale]);

  const getContactLink = () => {
    if (CompanyService.isUserCompanyAdmin(user, company) === true) {
      return <Link to={COMPANY_BILLING_URL}><FormattedMessage id="update-subscription" /></Link>;
    }
    return (
      <span><FormattedMessage id="contact-admin" /></span>
    );
  };
  if (state.show !== true) {
    return null;
  }

  if (state.invalidItems.length > 0) {
    return (
      <PackageNoticeBoardWrapper>
        <Alert
          showIcon
          className={'message-content'}
          message={intl.formatMessage({ id: 'package-limit-reached' })}
          description={
            <div>
              {state.invalidItems.map((item) => item.error)}
              {getContactLink()}
            </div>
          }
          type="warning"
          closable
        />
      </PackageNoticeBoardWrapper>
    );
  }

  return (
    <PackageNoticeBoardWrapper>
      <Alert
        showIcon
        className={'message-content'}
        message={intl.formatMessage({ id: 'invalid-plan' })}
        description={
          <div>
            {intl.formatMessage({ id: 'current-invalid-plan' })}{getContactLink()}
          </div>
        }
        type="warning"
        closable
      />
    </PackageNoticeBoardWrapper>
  );
};


export default PackageNoticeBoard;

import React from 'react';
import moment from 'moment';
import { BACK_END_URL } from '../../UrlMap';
import ICompany from '../../Types/Company/ICompany';
import UserCompanySelector from './UserCompanySelector';
import Result from '../Form/Result';
import Button from '../Form/Button';

const CompanyInvalidNotice =  ({ company, ...props } : {company?: ICompany | null}) => {
  const getTitle = () => {
    if (!company || company.active === undefined) {
      return 'Invalid Company';
    }
    if (company.active !== true && company.active !== 1) {
      return 'Company Deleted';
    }
    return 'Invalid Company';
  };

  const getSubtitle = () => {
    if (!company || !company.id || company.active === undefined) {
      return 'Unfortunately, the company is invalid.';
    }
    if (company.active !== true && company.active !== 1) {
      return `${company.name} has been deleted @ ${moment(company.updated_at).format('lll')}`;
    }
    return null;
  };

  return (
    <Result
      {...props}
      status="500"
      title={getTitle()}
      subTitle={getSubtitle()}
      extra={[
        <UserCompanySelector key={'company-selector'}/>,
        <Button type="primary" href={BACK_END_URL}>
          Back
        </Button>
      ]}
    />
  );
};

export default CompanyInvalidNotice;

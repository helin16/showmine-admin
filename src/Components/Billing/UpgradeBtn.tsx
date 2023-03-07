import {COMPANY_BILLING_URL} from '../../UrlMap';
import translate from '../../i18n/translate';
import Button from '../Form/Button';
import React from 'react';

const UpgradeBtn = () => {
  return (
    <Button type="primary" href={COMPANY_BILLING_URL}>{translate('upgrade')}</Button>
  )
}

export default UpgradeBtn

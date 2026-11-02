import React from 'react'
import { MENU_KEY_COMPANY_BILLING } from '../../Components/Menu/MenuItems'
import CompanyBilling from '../../Components/Company/CompanyBilling'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import translate from '../../i18n/translate'

const CompanyBillingPage = () => (
  <BackendPage
    selectedMenu={MENU_KEY_COMPANY_BILLING}
    ContentHeader={<BackendPageContentTitle title={translate('billing')} />}
  >
    <CompanyBilling />
  </BackendPage>
)

export default CompanyBillingPage

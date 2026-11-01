import React from 'react'
import { MENU_KEY_COMPANY_LIST } from '../../Components/Menu/MenuItems'
import CompanyList from '../../Components/Company/CompanyList'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import translate from '../../i18n/translate'

const CompanyListPage = () => (
  <BackendPage
    selectedMenu={MENU_KEY_COMPANY_LIST}
    ContentHeader={<BackendPageContentTitle title={translate('company_list')} />}
  >
    <CompanyList />
  </BackendPage>
)

export default CompanyListPage

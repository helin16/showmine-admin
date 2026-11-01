import React from 'react'
import { MENU_KEY_COMPANY_LIST } from '../../Components/Menu/MenuItems'
import CompanyList from '../../Components/Company/CompanyList'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'

const CompanyListPage = () => (
  <BackendPage
    selectedMenu={MENU_KEY_COMPANY_LIST}
    checkPackage={false}
    ContentHeader={<BackendPageContentTitle title={'Company List'} />}
  >
    <CompanyList />
  </BackendPage>
)

export default CompanyListPage

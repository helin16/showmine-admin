import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_COMPANY_USERS } from '../../Components/Menu/MenuItems'
import CompanyUserList from '../../Components/User/CompanyUserList'
import CompanyUserInviteBtn from '../../Components/User/CompanyUserInviteBtn'
import translate from '../../i18n/translate'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import Card from '../../Components/Form/Card'

type iState = {
  searchTxt?: string
}
const initialState: iState = {}
const CompanyUsersPage = () => {
  const [state] = useState(initialState)
  const { company } = useSelector((s: RootState) => s.auth);

  const getListDiv = () => {
    if (!company) return null
    return <CompanyUserList searchKeyWord={state.searchTxt} />
  }

  return (
    <BackendPage
      selectedMenu={MENU_KEY_COMPANY_USERS}
      ContentHeader={
        <BackendPageContentTitle title={translate('users')} controls={<CompanyUserInviteBtn />} />
      }
    >
      <Card>{getListDiv()}</Card>
    </BackendPage>
  )
}

export default CompanyUsersPage

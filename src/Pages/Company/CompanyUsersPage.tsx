import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_COMPANY_USERS } from '../../Components/Menu/MenuItems'
import CompanyUserList from '../../Components/User/CompanyUserList'
import CompanyUserInvitePanel from '../../Components/User/CompanyUserInvitePanel'
import CompanyUserPendingList from '../../Components/User/CompanyUserPendingList'
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
  const [approvals, setApprovals] = useState(0)
  // A new key counts the users again, so the invite form follows the plan.
  const [removals, setRemovals] = useState(0)
  const { company } = useSelector((s: RootState) => s.auth);

  const getListDiv = () => {
    if (!company) return null
    return (
      <CompanyUserList
        key={approvals}
        searchKeyWord={state.searchTxt}
        onRemoved={() => setRemovals((count) => count + 1)}
      />
    )
  }

  return (
    <BackendPage
      selectedMenu={MENU_KEY_COMPANY_USERS}
      ContentHeader={<BackendPageContentTitle title={translate('users')} />}
    >
      {!company ? null : (
        <>
          <Card>
            <CompanyUserInvitePanel key={`${approvals}-${removals}`} />
          </Card>
          <CompanyUserPendingList onChanged={() => setApprovals((count) => count + 1)} />
        </>
      )}
      <Card>{getListDiv()}</Card>
    </BackendPage>
  )
}

export default CompanyUsersPage

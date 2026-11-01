import React from 'react'
import AuthPage from '../../Layouts/AuthPage'
import PageBox from '../../Components/PageBox'
import AppLogo from '../../Components/AppLogo'
import InviteForm from '../../Components/Auth/InviteForm'

const InvitePage = () => (
  <AuthPage>
    <PageBox className={'action-panel'}>
      <AppLogo />
      <InviteForm />
    </PageBox>
  </AuthPage>
)

export default InvitePage

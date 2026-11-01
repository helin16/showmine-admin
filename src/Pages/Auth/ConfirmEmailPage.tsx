import React from 'react'
import AuthPage from '../../Layouts/AuthPage'
import PageBox from '../../Components/PageBox'
import AppLogo from '../../Components/AppLogo'
import ConfirmEmailForm from '../../Components/Auth/ConfirmEmailForm'

const ConfirmEmailPage = () => (
  <AuthPage>
    <PageBox className={'action-panel'}>
      <AppLogo />
      <ConfirmEmailForm />
    </PageBox>
  </AuthPage>
)

export default ConfirmEmailPage

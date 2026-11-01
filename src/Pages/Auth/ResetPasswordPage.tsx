import React from 'react'
import AuthPage from '../../Layouts/AuthPage'
import PageBox from '../../Components/PageBox'
import AppLogo from '../../Components/AppLogo'
import ResetPasswordForm from '../../Components/Auth/ResetPasswordForm'

const ResetPasswordPage = () => (
  <AuthPage>
    <PageBox className={'action-panel'}>
      <AppLogo />
      <ResetPasswordForm />
    </PageBox>
  </AuthPage>
)

export default ResetPasswordPage

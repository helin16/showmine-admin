import React from 'react'
import AuthPage from '../../Layouts/AuthPage'
import PageBox from '../../Components/PageBox'
import AppLogo from '../../Components/AppLogo'
import SignUpForm from '../../Components/Auth/SignUpForm'

const SignUpPage = () => (
  <AuthPage>
    <PageBox className={'action-panel'}>
      <AppLogo />
      <SignUpForm />
    </PageBox>
  </AuthPage>
)

export default SignUpPage

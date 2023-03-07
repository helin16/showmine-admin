import React from 'react';
import AuthPage from '../../Layouts/AuthPage';
import PageBox from '../../Components/PageBox';
import AppLogo from '../../Components/AppLogo';
import RetrievePasswordForm from '../../Components/Auth/RetrievePasswordForm';

const ForgotPasswordPage = () => (
    <AuthPage>
      <PageBox className={'action-panel'}>
        <AppLogo />
        <RetrievePasswordForm />
      </PageBox>
    </AuthPage>
);

export default ForgotPasswordPage;

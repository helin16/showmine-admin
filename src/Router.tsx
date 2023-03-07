import AppWrapper from './Styles/AppWrapper';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import LoginPage from './Pages/Auth/LoginPage';
import Page404 from './Pages/Error/Page404';
import React from 'react';
import {BACK_END_URL, FORGOT_PASSWORD_URL, LOGIN_URL, MEDIA_LIST_URL} from './UrlMap';
import ForgotPasswordPage from './Pages/Auth/ForgotPasswordPage';
import ProtectedRoute from './Components/Auth/ProtectedRoute';
import DashBoardPage from './Pages/Dashboard/DashBoardPage';
import MediaListPage from './Pages/Media/MediaListPage';

const Router = () => {
  return (
    <AppWrapper className={'app-wrapper'}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />}/>
          <Route path={LOGIN_URL} element={<LoginPage />}/>
          <Route path={FORGOT_PASSWORD_URL} element={<ForgotPasswordPage />}/>

          <Route
            path={BACK_END_URL}
            element={<ProtectedRoute><DashBoardPage /></ProtectedRoute>} />

          <Route
            path={MEDIA_LIST_URL}
            element={<ProtectedRoute><MediaListPage /></ProtectedRoute>} />

          <Route path="*" element={<Page404 />} />
        </Routes>
      </BrowserRouter>
    </AppWrapper>
  )
}

export default Router;

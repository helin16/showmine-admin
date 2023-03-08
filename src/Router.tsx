import AppWrapper, {AppCssWrapper} from './Styles/AppWrapper';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import LoginPage from './Pages/Auth/LoginPage';
import Page404 from './Pages/Error/Page404';
import React from 'react';
import {
  BACK_END_URL,
  COMMENTS_LIST_URL,
  COMPANY_ADMIN_URL,
  COMPANY_BILLING_URL,
  COMPANY_CHANNEL_NEW_URL,
  COMPANY_CHANNELS_URL,
  COMPANY_LIST_URL,
  COMPANY_USERS_URL,
  FORGOT_PASSWORD_URL,
  LOGIN_URL,
  MEDIA_LIST_URL,
  MY_PROFILE_URL
} from './UrlMap';
import ForgotPasswordPage from './Pages/Auth/ForgotPasswordPage';
import ProtectedRoute from './Components/Route/ProtectedRoute';
import DashBoardPage from './Pages/Dashboard/DashBoardPage';
import MediaListPage from './Pages/Media/MediaListPage';
import CommentsListPage from './Pages/Comments/CommentsListPage';
import MyProfilePage from './Pages/User/MyProfilePage';
import CompanyAdminRoute from './Components/Route/CompanyAdminRoute';
import CompanyEditPage from './Pages/Company/CompanyEditPage';
import BillingPage from './Pages/Company/BillingPage';
import CompanyUsersPage from './Pages/Company/CompanyUsersPage';
import SuperAdminRoute from './Components/Route/SuperAdminRoute';
import CompanyListPage from './Pages/Company/CompanyListPage';
import CompanyChannelsPage from './Pages/Channel/ChannelsPage';
import CompanyNewChannelPage from './Pages/Channel/CompanyNewChannelPage';

const Router = () => {
  return (
    <>
      <AppCssWrapper />
      <AppWrapper className={'app-wrapper'}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />}/>
            <Route path={LOGIN_URL} element={<LoginPage />}/>
            <Route path={FORGOT_PASSWORD_URL} element={<ForgotPasswordPage />}/>

            <Route path={MY_PROFILE_URL}
                   element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />

            <Route
              path={BACK_END_URL}
              element={<ProtectedRoute><DashBoardPage /></ProtectedRoute>} />

            <Route
              path={COMMENTS_LIST_URL}
              element={<ProtectedRoute><CommentsListPage /></ProtectedRoute>} />
            <Route
              path={MEDIA_LIST_URL}
              element={<ProtectedRoute><MediaListPage /></ProtectedRoute>} />


            <Route
              path={COMPANY_ADMIN_URL}
              element={<ProtectedRoute><CompanyAdminRoute><CompanyEditPage /></CompanyAdminRoute></ProtectedRoute>} />
            <Route
              path={COMPANY_BILLING_URL}
              element={<ProtectedRoute><CompanyAdminRoute><BillingPage /></CompanyAdminRoute></ProtectedRoute>} />
            <Route
              path={COMPANY_CHANNEL_NEW_URL}
              element={<ProtectedRoute><CompanyAdminRoute><CompanyNewChannelPage /></CompanyAdminRoute></ProtectedRoute>} />
            <Route
              path={COMPANY_CHANNELS_URL}
              element={<ProtectedRoute><CompanyAdminRoute><CompanyChannelsPage /></CompanyAdminRoute></ProtectedRoute>} />
            <Route
              path={COMPANY_USERS_URL}
              element={<ProtectedRoute><CompanyAdminRoute><CompanyUsersPage /></CompanyAdminRoute></ProtectedRoute>} />

            <Route
              path={COMPANY_LIST_URL}
              element={<ProtectedRoute><SuperAdminRoute><CompanyListPage /></SuperAdminRoute></ProtectedRoute>} />

            <Route path="*" element={<Page404 />} />
          </Routes>
        </BrowserRouter>
      </AppWrapper>
    </>
  )
}

export default Router;

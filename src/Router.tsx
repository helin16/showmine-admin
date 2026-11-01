import AppWrapper, { AppCssWrapper } from './Styles/AppWrapper'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './Pages/Auth/LoginPage'
import Page404 from './Pages/Error/Page404'
import React, { lazy, Suspense } from 'react'
import {
  ARTICLE_DETAILS_URL,
  ARTICLE_LIST_URL,
  BACK_END_URL,
  COMMENTS_LIST_URL,
  COMPANY_ADMIN_URL,
  COMPANY_CHANNEL_NEW_URL,
  COMPANY_CHANNELS_URL,
  COMPANY_LIST_URL,
  COMPANY_USERS_URL,
  FORGOT_PASSWORD_URL,
  LOGIN_URL,
  MEDIA_LIST_URL,
  MY_PROFILE_URL,
  RESET_PASSWORD_URL,
  WIZARD_URL,
} from './UrlMap'
import ProtectedRoute from './Components/Route/ProtectedRoute'
import CompanyAdminRoute from './Components/Route/CompanyAdminRoute'
import SuperAdminRoute from './Components/Route/SuperAdminRoute'
import ChunkErrorBoundary from './Components/Error/ChunkErrorBoundary'
import { SyncOutlined } from '@ant-design/icons'
import Result from './Components/Form/Result'
import translate from './i18n/translate'

const ForgotPasswordPage = lazy(() => import('./Pages/Auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./Pages/Auth/ResetPasswordPage'))
const DashBoardPage = lazy(() => import('./Pages/Dashboard/DashBoardPage'))
const MediaListPage = lazy(() => import('./Pages/Media/MediaListPage'))
const CommentsListPage = lazy(() => import('./Pages/Comments/CommentsListPage'))
const MyProfilePage = lazy(() => import('./Pages/User/MyProfilePage'))
const CompanyEditPage = lazy(() => import('./Pages/Company/CompanyEditPage'))
const CompanyUsersPage = lazy(() => import('./Pages/Company/CompanyUsersPage'))
const CompanyListPage = lazy(() => import('./Pages/Company/CompanyListPage'))
const CompanyChannelsPage = lazy(() => import('./Pages/Channel/ChannelsPage'))
const CompanyNewChannelPage = lazy(() => import('./Pages/Channel/CompanyNewChannelPage'))
const WizardPage = lazy(() => import('./Pages/User/WizardPage'))
const ArticleListPage = lazy(() => import('./Pages/Article/ArticleListPage'))
const ArticleDetailsPage = lazy(() => import('./Pages/Article/ArticleDetailsPage'))

const PageLoading = () => (
  <div role='status'>
    <Result icon={<SyncOutlined spin />} title={translate('page-loading')} />
  </div>
)

const Router = () => {
  return (
    <>
      <AppCssWrapper />
      <AppWrapper className={'app-wrapper'}>
        <BrowserRouter>
          <ChunkErrorBoundary>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path='/' element={<LoginPage />} />
                <Route path={LOGIN_URL} element={<LoginPage />} />
                <Route path={FORGOT_PASSWORD_URL} element={<ForgotPasswordPage />} />
                <Route path={RESET_PASSWORD_URL} element={<ResetPasswordPage />} />

                <Route
                  path={MY_PROFILE_URL}
                  element={
                    <ProtectedRoute allowNoCompany>
                      <MyProfilePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path={BACK_END_URL}
                  element={
                    <ProtectedRoute>
                      <DashBoardPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path={ARTICLE_LIST_URL}
                  element={
                    <ProtectedRoute>
                      <ArticleListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ARTICLE_DETAILS_URL}
                  element={
                    <ProtectedRoute>
                      <ArticleDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={COMMENTS_LIST_URL}
                  element={
                    <ProtectedRoute>
                      <CommentsListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={MEDIA_LIST_URL}
                  element={
                    <ProtectedRoute>
                      <MediaListPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path={WIZARD_URL}
                  element={
                    <ProtectedRoute>
                      <WizardPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path={COMPANY_ADMIN_URL}
                  element={
                    <ProtectedRoute>
                      <CompanyAdminRoute>
                        <CompanyEditPage />
                      </CompanyAdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={COMPANY_CHANNEL_NEW_URL}
                  element={
                    <ProtectedRoute>
                      <CompanyAdminRoute>
                        <CompanyNewChannelPage />
                      </CompanyAdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={COMPANY_CHANNELS_URL}
                  element={
                    <ProtectedRoute>
                      <CompanyAdminRoute>
                        <CompanyChannelsPage />
                      </CompanyAdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={COMPANY_USERS_URL}
                  element={
                    <ProtectedRoute>
                      <CompanyAdminRoute>
                        <CompanyUsersPage />
                      </CompanyAdminRoute>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path={COMPANY_LIST_URL}
                  element={
                    <ProtectedRoute>
                      <SuperAdminRoute>
                        <CompanyListPage />
                      </SuperAdminRoute>
                    </ProtectedRoute>
                  }
                />

                <Route path='*' element={<Page404 />} />
              </Routes>
            </Suspense>
          </ChunkErrorBoundary>
        </BrowserRouter>
      </AppWrapper>
    </>
  )
}

export default Router

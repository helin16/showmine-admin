import * as React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { lazy, useEffect, useState } from 'react'
import { RootState } from '../../Redux/makeReduxStore'
import AuthService from '../../Services/AuthService'
import {
  isAuthenticated as isAuthed,
  removedAuthentication,
  changeAuthenticating,
} from '../../Redux/reduxers/auth.slice'
import AppInit from '../AppInit'
import { LOGIN_URL } from '../../UrlMap'
import LocalStorageService from '../../Services/LocalStorageService';
import {changeLocale} from '../../Redux/reduxers/app.slice';
import Locale from '../Form/Locale';
import Result from '../Form/Result';
import Button from '../Form/Button';
import translate from '../../i18n/translate';

const NoCompanyNotice = lazy(() => import('../Company/NoCompanyNotice'))

/**
 *
 * @param props
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProtectedRoute = ({ children, allowNoCompany = false }: any) => {
  const { app: appState, auth: { user, company, isAuthenticating } } = useSelector((s: RootState) => s);
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [isRateLimited, setIsRateLimited] = useState(false)

  /**
   * getting the details for the current user
   */
  useEffect(() => {
    if (user) {
      return
    }
    dispatch(
      changeAuthenticating({
        isAuthenticating: true,
      }),
    )
    let isCancelled = false
    AuthService.getMe()
      .then((res) => {
        if (isCancelled === true) return
        // A notification names its company, as staff can be in several. Only one of theirs counts, and the API still decides.
        const linkedCompanyId = new URLSearchParams(search).get('company')
        const linkedCompany = res.companies.find(({ companyId }) => companyId === linkedCompanyId)?.Company
        let userCompany = linkedCompany
        if (!userCompany && res.user.LastVisitCompany) {
          userCompany = res.user.LastVisitCompany
        } else if (!userCompany && res.companies.length > 0) {
          userCompany = res.companies[0].Company;
        }
        // Before the page can render, as its API calls send this.
        LocalStorageService.setCompanyId(`${userCompany?.id || ''}`.trim());
        dispatch(
          isAuthed({
            user: res.user,
            company: userCompany,
            companyUsers: res.companies,
            pendingCompanies: res.pendingCompanies,
          }),
        );
        dispatch(
          changeLocale({
          ...appState,
          locale: `${res.user.languageCode}` === Locale.enUS.locale ? Locale.enUS : Locale.zhCN
        }));
      })
      .catch((err) => {
        if (isCancelled === true) return
        // The sign-in is still good. Dropping it would send WeChat users off to sign in again, adding to the load.
        if (err.response?.status === 429) {
          setIsRateLimited(true)
          return
        }
        AuthService.removeLocalAuthToken()
        dispatch(removedAuthentication())
        navigate(LOGIN_URL, { state: { from: `${pathname}${search}` } })
      })
      .finally(() => {
        dispatch(
          changeAuthenticating({
            isAuthenticating: false,
          }),
        )
      })
    return () => {
      // eslint-disable-line
      isCancelled = true
    }
  }, [dispatch, navigate, user, pathname, search])

  if (isRateLimited === true) {
    return (
      <Result
        status='warning'
        title={translate('request-too-many')}
        extra={<Button onClick={() => window.location.reload()}>{translate('retry')}</Button>}
      />
    )
  }

  if (isAuthenticating === true || !user) {
    return <AppInit />
  }

  // Here and not in BackendPage: pages fetch as they mount, and company APIs fail with no company.
  if (allowNoCompany !== true && user.isSuperAdmin !== true && `${company?.id || ''}`.trim() === '') {
    return <NoCompanyNotice />
  }

  return children
}

export default ProtectedRoute

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
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

/**
 *
 * @param props
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProtectedRoute = ({ children }: any) => {
  const { app: appState, auth: { user, isAuthenticating } } = useSelector((s: RootState) => s);
  const dispatch = useDispatch()
  const navigate = useNavigate()

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
        let userCompany = undefined
        if (res.user.LastVisitCompany) {
          userCompany = res.user.LastVisitCompany
        } else if (res.companies.length > 0) {
          userCompany = res.companies[0].Company;
        }
        dispatch(
          isAuthed({
            user: res.user,
            company: userCompany,
            companyUsers: res.companies,
          }),
        );
        dispatch(
          changeLocale({
          ...appState,
          locale: `${res.user.languageCode}` === Locale.enUS.locale ? Locale.enUS : Locale.zhCN
        }));
        LocalStorageService.setCompanyId(`${userCompany?.id || ''}`.trim());
      })
      .catch(() => {
        if (isCancelled === true) return
        AuthService.removeLocalAuthToken()
        dispatch(removedAuthentication())
        navigate(LOGIN_URL)
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
  }, [dispatch, navigate, user])

  if (isAuthenticating === true) {
    return <AppInit />
  }

  return children
}

export default ProtectedRoute

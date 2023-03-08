import * as React from 'react';
import {useNavigate} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { RootState } from '../../Redux/makeReduxStore';
import AuthService from '../../Services/AuthService';
import {
  isAuthenticated as isAuthed,
  changeCompanyPackage,
  removedAuthentication, changeAuthenticating,
} from '../../Redux/reduxers/auth.slice';
import AppInit from '../AppInit';
import { LOGIN_URL } from '../../UrlMap';
import CompanyService from '../../Services/CompanyService';

/**
 *
 * @param props
 */
const ProtectedRoute = ({children}: any) => {
  const [companyId, setCompanyId] = useState('');

  const { user, isAuthenticating } = useSelector(
    (s: RootState) => s.auth,
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /**
   * getting the details for the current user
   */
  useEffect(() => {
    if (user) {
      return;
    }
    dispatch(changeAuthenticating({
      isAuthenticating: true,
    }))
    let isCancelled = false;
    AuthService.getMe()
      .then((res) => {
        if (isCancelled === true) return;
        let userCompany = null;
        if (res.data.is_admin) {
          userCompany = res.data.last_visit_company;
        } else if (res.data.userCompany && res.data.userCompany.length > 0) {
          [userCompany] = res.data.userCompany;
        } else {
          userCompany = res.data.last_visit_company;
        }
        dispatch(isAuthed({
          user: res.data,
          company: userCompany,
        }));
        setCompanyId(userCompany.id);
      })
      .catch(() => {
        if (isCancelled === true) return;
        AuthService.removeLocalAuthToken();
        dispatch(removedAuthentication());
        navigate(LOGIN_URL);
      })
      .finally(() => {
        dispatch(changeAuthenticating({
          isAuthenticating: false,
        }));
      })
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [dispatch, navigate, user]);
  /**
   *
   */
  useEffect(() => {
    if (companyId === '') {
      return;
    }
    let isCancelled = false;
    CompanyService.getPackageDetails(companyId)
      .then((res) => {
        if (isCancelled === true) return;
        dispatch(changeCompanyPackage({ companyPackage: res.data }));
      })
      .catch(() => {
        if (isCancelled === true) return;
        dispatch(changeCompanyPackage({ companyPackage: null }));
      });
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [dispatch, companyId]);

  if (isAuthenticating === true) {
    return <AppInit />;
  }

  return children;
};

export default ProtectedRoute;

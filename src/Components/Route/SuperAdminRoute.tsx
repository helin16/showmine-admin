import * as React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/makeReduxStore';
import InvalidAccessPanel from '../Error/InvalidAccessPanel';
import { BACK_END_URL } from '../../UrlMap';
import CompanyService from '../../Services/CompanyService';

/**
 *
 * @param props
 */
const SuperAdminRoute = ({children}: {children: any}) => {
  const { user } = useSelector((s: RootState) => s.auth);

  if (CompanyService.isUserSuperAdmin(user) !== true) {
    return (<InvalidAccessPanel homeUrl={BACK_END_URL} />);
  }

  return children;
};

export default SuperAdminRoute;

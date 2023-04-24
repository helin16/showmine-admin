import * as React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import InvalidAccessPanel from '../Error/InvalidAccessPanel'
import { BACK_END_URL } from '../../UrlMap'
import {ROLE_ADMIN} from '../../Types/Company/ICompanyUser';

/**
 *
 * @param props
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CompanyAdminRoute = ({ children }: { children: any }) => {
  const { company, user, companyUsers } = useSelector((s: RootState) => s.auth)
  const companyAdminUsers = (companyUsers || []).filter(companyUser => `${company?.id || ''}` === companyUser.companyId && companyUser.isActive === true && companyUser.isPending === false && companyUser.role === ROLE_ADMIN)
  if (user?.isSuperAdmin === true || companyAdminUsers.length > 0) {
    return children
  }
  return <InvalidAccessPanel homeUrl={BACK_END_URL} />
}

export default CompanyAdminRoute

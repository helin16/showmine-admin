import * as React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import InvalidAccessPanel from '../Error/InvalidAccessPanel'
import { BACK_END_URL } from '../../UrlMap'
import {ROLE_ADMIN} from '../../Types/Company/ICompanyUser';

// Whether the signed-in user may administer the current company: one of its admins, or a super admin.
export const useIsCompanyAdmin = () => {
  const { company, user, companyUsers } = useSelector((s: RootState) => s.auth)
  const companyAdminUsers = (companyUsers || []).filter(companyUser => `${company?.id || ''}` === companyUser.companyId && companyUser.isActive === true && companyUser.isPending === false && companyUser.role === ROLE_ADMIN)
  return user?.isSuperAdmin === true || companyAdminUsers.length > 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CompanyAdminRoute = ({ children }: { children: any }) => {
  if (useIsCompanyAdmin()) {
    return children
  }
  return <InvalidAccessPanel homeUrl={BACK_END_URL} />
}

export default CompanyAdminRoute

import * as React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import InvalidAccessPanel from '../Error/InvalidAccessPanel'
import { BACK_END_URL } from '../../UrlMap'
import CompanyService from '../../Services/CompanyService'

/**
 *
 * @param props
 */
const CompanyAdminRoute = ({ children }: { children: any }) => {
  const { company, user } = useSelector((s: RootState) => s.auth)

  if (user?.isSuperAdmin === true) {
    return children
  }
  return <InvalidAccessPanel homeUrl={BACK_END_URL} />
}

export default CompanyAdminRoute

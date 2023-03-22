import IUser from '../User/IUser'
import ICompany from '../Company/ICompany'
import ICompanyUser from '../Company/ICompanyUser';

type ISession = {
  isAuthenticating?: boolean
  isAuthenticated?: boolean
  redirectPathOnAuthentication?: string
  user?: IUser | null
  company?: ICompany | null;
  companyUsers?: ICompanyUser[];
  // companyPackage?: IPackage | null, // null means no package information or there is an error
}

export default ISession

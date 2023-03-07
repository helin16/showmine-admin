import IUser from '../User/IUser';
import ICompany from '../Company/ICompany';
import IPackage from '../Package/IPackage';

type ISession = {
  isAuthenticated?: boolean;
  redirectPathOnAuthentication?: string;
  user?: IUser | null
  company?: ICompany | null,
  companyPackage?: IPackage | null, // null means no package information or there is an error
};

export default ISession;

import IBaseModel from '../IBaseModel'
import IArticle from './IArticle'
import ICompany from '../Company/ICompany'
import IUser from '../User/IUser';

type IItemVisit = IBaseModel & {
  itemId: string;
  source: string;
  companyId: string;
  sharedById?: string | null;
  Item?: IArticle;
  Company?: ICompany;
  SharedBy?: IUser;
}

export default IItemVisit

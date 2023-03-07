import IBaseModel from '../iBaseType';
import IUser from './IUser';

interface ICompanyUser extends IBaseModel {
  company_id: string, // eslint-disable-line
  user: IUser,
  user_id: string, // eslint-disable-line
  pending: boolean,
  role_id: number | string, // eslint-disable-line
}

export default ICompanyUser;

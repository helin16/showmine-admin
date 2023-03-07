import ICompany from '../Company/ICompany';

type IUser = {
  id?: string,
  // eslint-disable-next-line
  is_admin: boolean,  // whether is super admin
  email: string,
  title: string,
  first_name: string, // eslint-disable-line
  last_name: string, // eslint-disable-line
  mobile: string,
  nick_name: string // eslint-disable-line

  address?: [],
  address_id: string | null, // eslint-disable-line
  adminOfCompanyIds: string[],

  avatar_asset: string, // eslint-disable-line
  avatar_img: string, // eslint-disable-line
  channel_id: string, // eslint-disable-line
  language_id: string, // eslint-disable-line
  sex_id: string, // eslint-disable-line

  last_visit_company?: ICompany, // eslint-disable-line
  last_visit_company_id: string, // eslint-disable-line
  userCompany: ICompany[],

  wechat_is_subscriber: boolean, // eslint-disable-line
  password?: string, // eslint-disable-line
}

export default IUser;

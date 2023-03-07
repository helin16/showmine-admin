import IBaseModel, { initialBaseModel } from '../iBaseType';
import ICompanyAuthor from './ICompanyAuthor';
import IAsset from '../Asset/IAsset';

interface ICompany extends IBaseModel {
  id?: string,
  name: string,
  company_number: string, // eslint-disable-line
  email: string,
  website: string,
  contact_number: string, // eslint-disable-line
  description: string,
  logo_img: IAsset | null, // eslint-disable-line

  is_sandbox: boolean, // eslint-disable-line
  is_fav_by_current_user: boolean, // eslint-disable-line

  admin_config: string, // eslint-disable-line
  adminConfigObj?: object,
  config: string, // json string
  configObj?: {
    account_info: [], // eslint-disable-line
    address: string,
    authorInfo: ICompanyAuthor[],
    defaultContact: string,
    slogan: string,
    defaultRedeemDesc: string,
    ifChangeToGrid: boolean,
    ifShowAvatar: boolean,
  },

  followers: number,

  media_space_size: number, // eslint-disable-line

  package_id: string, // eslint-disable-line
  package_price: number | null, // eslint-disable-line
  paid_to: string | null, // eslint-disable-line
  qr_img: string, // eslint-disable-line
  stripe_id: string, // eslint-disable-line
  companyTags?: string[],

  setting?: {
    customise_msg: string, // eslint-disable-line
    excerpt_limit: number, // eslint-disable-line
  }

  has_been_setup?: boolean, // eslint-disable-line
  has_set_channel?: boolean, // eslint-disable-line
  has_set_article?: boolean, // eslint-disable-line
  has_done_wizard?: boolean, // eslint-disable-line
}

export const initialCompany: ICompany = {
  ...initialBaseModel,
  name: '',
  company_number: '',
  email: '',
  website: '',
  contact_number: '',
  description: '',
  logo_img: null,

  is_sandbox: true,
  is_fav_by_current_user: false,

  admin_config: '',
  config: '',

  followers: 0,
  media_space_size: 0,

  package_id: '',
  package_price: null,
  paid_to: null,
  qr_img: '',
  stripe_id: '',
};

export default ICompany;

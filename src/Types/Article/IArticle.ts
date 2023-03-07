import IUser from '../User/IUser';
import IVisitStat from './IVisitStat';
import IBaseModel, { initialBaseModel } from '../IBaseModel';
import { DATE_TIME_MAX } from '../../Constants';
import ICompany from '../Company/ICompany';
import IAddress from '../Address/IAddress';
import ITag from '../Tag/ITag';
import IAsset from '../Asset/IAsset';

interface IArticle extends IBaseModel {
  id?: string,
  slug: string,
  title: string,
  author: string,
  author_links: string | null, // eslint-disable-line
  type_id: string, // eslint-disable-line
  description?: string,

  company_id: string, // eslint-disable-line
  company?: ICompany,
  company_tags?: Array<string>, // eslint-disable-line

  visit_stat: IVisitStat | null, // eslint-disable-line
  visit_times? : number, // eslint-disable-line

  address?: IAddress,
  address_id?: string | null, // eslint-disable-line
  config: string,
  configObj?: {
    ifShowCompanyContact?: boolean
  },

  customiseExcerpt: boolean,
  excerpt?: string,

  images: IAsset[],
  images_in_diff_sizes?: {  // eslint-disable-line
    origImages: {[key: string]: IAsset},
    midImages: {[key: string]: IAsset},
    smallImages: {[key: string]: IAsset},
    largeImages: {[key: string]: IAsset},
  },

  include_surcharge?: boolean, // eslint-disable-line
  is_draft: boolean | number, // eslint-disable-line
  is_published: boolean | number, // eslint-disable-line

  parent_id: string | null, // eslint-disable-line
  seller: IUser | null,
  seller_id: string, // eslint-disable-line

  date_publish: string, // eslint-disable-line
  date_expiry: string, // eslint-disable-line
  date_start?: string, // eslint-disable-line

  is_sync_to_market: boolean, // eslint-disable-line
  multi_participations: boolean, // eslint-disable-line

  tags: ITag[],

  selectedChannel?: string[],

  tagNames?: string[],
  predefinedTags?: {[key: number]: string|number},
}

export const initialArticle: IArticle = {
  ...initialBaseModel,
  slug: '',
  title: '',
  author: '',
  author_links: '', // eslint-disable-line
  type_id: '', // eslint-disable-line

  company_id: '', // eslint-disable-line

  visit_stat: null, // eslint-disable-line
  visit_times : 0, // eslint-disable-line

  config: '',
  configObj: {},

  customiseExcerpt: false,

  images: [],

  is_draft: 1, // eslint-disable-line
  is_published: 0, // eslint-disable-line

  parent_id: null, // eslint-disable-line
  seller: null,
  seller_id: '', // eslint-disable-line

  date_publish: '', // eslint-disable-line
  date_expiry: DATE_TIME_MAX, // eslint-disable-line

  is_sync_to_market: false, // eslint-disable-line
  multi_participations: false, // eslint-disable-line

  tags: [],
};

export interface iSearchCriteria {
  is_draft?: number, // eslint-disable-line
  is_end?: number, // eslint-disable-line
  is_published?: number, // eslint-disable-line
  'key-word': string, // eslint-disable-line
}

export default IArticle;

import IBaseModel, { initialBaseModel } from '../IBaseModel';

export enum PACKAGE_ITEM_TYPES {
  ITEM = 'ITEM_LIMIT',
  STORAGE = 'STORAGE_LIMIT',
  TIME = 'TIME_LIMIT',
  CHANNEL = 'CHANNEL_LIMIT',
  USER = 'USER_LIMIT',
}

interface IValidateResult {
  is_valid: boolean, // eslint-disable-line
  real_num: number, // eslint-disable-line
  max_num: number, // eslint-disable-line
}

export interface IPackageItem extends IBaseModel {
  package_id: string, // eslint-disable-line
  limit: number,
  class_name: string, // eslint-disable-line
  name: PACKAGE_ITEM_TYPES
}

export const initialPackageItem: IPackageItem = {
  ...initialBaseModel,
  package_id: '',
  limit: -1,
  class_name: '',
  name: PACKAGE_ITEM_TYPES.ITEM,
};

interface IPackage extends IBaseModel {
  name: string,
  class_name: string, // eslint-disable-line
  order: number,
  is_valid: boolean, // eslint-disable-line

  stripe_plan_id: string, // eslint-disable-line
  price: number,

  package_item_details: IPackageItem[], // eslint-disable-line
  validate_result: { // eslint-disable-line
    [PACKAGE_ITEM_TYPES.ITEM]: IValidateResult
    [PACKAGE_ITEM_TYPES.STORAGE]: IValidateResult
    [PACKAGE_ITEM_TYPES.TIME]: IValidateResult
    [PACKAGE_ITEM_TYPES.CHANNEL]: IValidateResult
    [PACKAGE_ITEM_TYPES.USER]: IValidateResult
  }
}

export default IPackage;

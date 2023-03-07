import IBaseModel, { initialBaseModel } from '../IBaseModel';
import { ADDRESS_ID_VIC } from '../../Constants';

interface IAddress extends IBaseModel {
  country: string,
  street: string,
  state: string,
  suburb: string | null,
  postcode: number | null,
  latitude: number | null,
  longitude: number | null,
}

export const addressVic: IAddress = {
  ...initialBaseModel,
  id: ADDRESS_ID_VIC,
  country: 'Australia',
  latitude: null,
  longitude: null,
  postcode: null,
  state: 'Victoria',
  street: '',
  suburb: null,
};

export default IAddress;

import IBaseModel, { initialBaseModel } from '../IBaseModel';

interface IChannel extends IBaseModel {
  name: string,
  type: string,
  company_id: string, // eslint-disable-line
  credential: any, // eslint-disable-line
  valid: number | boolean,
  config: any, // eslint-disable-line
  isMainChannel: number | boolean,
}

export const initialChannel: IChannel = {
  ...initialBaseModel,
  name: '',
  type: '',
  company_id: '', // eslint-disable-line
  credential: {},
  valid: 0,
  config: {},
  isMainChannel: 0,
};

export default IChannel;

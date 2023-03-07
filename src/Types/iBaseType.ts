type IBaseModel = {
  id?: string,
  active: boolean | number,
  created_at: string, // eslint-disable-line
  created_by_id: string, // eslint-disable-line
  updated_at: string, // eslint-disable-line
  updated_by_id: string, // eslint-disable-line
};

export const initialBaseModel: IBaseModel = {
  active: 1,
  created_at: '',
  created_by_id: '',
  updated_at: '',
  updated_by_id: '',
};

export default IBaseModel;

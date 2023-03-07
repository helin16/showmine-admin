type ITag = {
  id?: string,
  active: boolean | number,
  name: string,
  type_id: string, // eslint-disable-line
  sortOrder: number,
  entity_id: string, // eslint-disable-line
  entity_name: string, // eslint-disable-line
};

export const initialTag: ITag = {
  active: 1,
  name: '',
  type_id: '',
  sortOrder: 0,
  entity_id: '', // eslint-disable-line
  entity_name: '', // eslint-disable-line
};

export default ITag;

type IAsset = {
  id?: string,
  comment?: null | string,
  file_size: number, // eslint-disable-line
  mime_type?: string, // eslint-disable-line
  url: string,
  active?: boolean,
};

export const initAsset: IAsset = {
  url: '',
  file_size: 0,
};

export default IAsset;

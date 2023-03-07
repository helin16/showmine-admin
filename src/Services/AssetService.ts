import RestfulService from './RestfulService';

const getAllAssetsUnderACompany = async (companyId: string,
  params: object = {}, sortingField: string = 'updated_at',
  sortingDirection: string = 'desc') => RestfulService.get(`/company/assets/${companyId}/${sortingField}/${sortingDirection}`, params);

const deleteAsset = async (assetId: string) => RestfulService.delete(`/asset/${assetId}`);

const formatFileSize = (sizeInBytes: number, precision: number = 2) => {
  let value = (sizeInBytes / 1000);
  let suffix = 'KB';
  if (sizeInBytes >= 1000000000) {
    value = (sizeInBytes / 1000000000);
    suffix = 'GB';
  } else if (sizeInBytes >= 1000000) {
    value = (sizeInBytes / 1000000);
    suffix = 'MB';
  }
  return [value.toFixed(precision), suffix];
};

// eslint-disable-next-line
const uploadAsset = async (file: any) => RestfulService.post('/asset', file);

const getUploadAssetUrl = () => `${RestfulService.getApiEndPoint()}/asset`;

const AssetService = {
  getAllAssetsUnderACompany,
  formatFileSize,
  deleteAsset,
  getUploadAssetUrl,
  uploadAsset,
};

export default AssetService;

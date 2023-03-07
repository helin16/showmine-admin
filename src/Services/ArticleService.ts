import RestfulService from './RestfulService';
import { ADDRESS_ID_VIC, ITEM_TYPE_ID_ARTICLE } from '../Constants';
import IArticle from '../Types/Article/IArticle';
import IArticleHistoryItem from '../Types/Article/IArticleHistoryItem';
import IArticleSyncStatusItem from '../Types/Article/IArticleSyncStatusItem';

const formatArticle = (article: IArticle) => {
  let newArticle = { ...article };
  if (!article.configObj) {
    newArticle = {
      ...newArticle,
      configObj: JSON.parse(article.config),
    };
  }
  if (!article.is_sync_to_market || article.is_sync_to_market === null) {
    newArticle = {
      ...newArticle,
      is_sync_to_market: false, // eslint-disable-line
    };
  }
  if (!article.multi_participations || article.multi_participations === null ) { // eslint-disable-line
    newArticle = {
      ...newArticle,
      multi_participations: false, //eslint-disable-line
    };
  }
  if (!article.address_id || article.address_id === null) {
    newArticle = {
      ...newArticle,
      address_id: undefined,
      address: undefined,
    };
  }
  return newArticle;
};

const signBackArticle = (article: IArticle) => {
  let newArticle = { ...article };
  if (article.configObj) {
    newArticle = {
      ...newArticle,
      config: JSON.stringify(article.configObj || {}),
    };
  }
  return newArticle;
};

const getAllArticlesUnderACompany = async (companyId: string, params: object = {}) => RestfulService.get(`/item/company/${companyId}`, params);

const getArticleDetails = async (articleId: string, params: object = {}) => RestfulService.get(`/item/${articleId}`, params)
  .then((res) => ({ ...res, data: formatArticle(res.data) }));

const createArticleUnderACompany = async (companyId: string, params: IArticle) => RestfulService.post('/item', signBackArticle({
  ...params,
  type_id: ITEM_TYPE_ID_ARTICLE,
  company_id: companyId,
  address_id: ADDRESS_ID_VIC,
}));

const updateArticle = async (itemId: string, params: IArticle) => RestfulService.put(`/item/${itemId}`, signBackArticle(params))
  .then((res) => ({ ...res, data: formatArticle(res.data) }));

const deleteArticle = async (itemId: string) => RestfulService.delete(`/item/${itemId}`)
  .then((res) => ({ ...res, data: formatArticle(res.data) }));

const getArticleQrCode = async (itemId: string) => RestfulService.post(`/item/${itemId}/genItemQrCode`, {});

const getEditingHistory = async (itemId: string, params: object = {}) => RestfulService.get(`/item/${itemId}/history`, params)
  .then((res) => ({
    ...res,
    data: {
      ...res.data,
      data: res.data.data.map((item: IArticleHistoryItem) => ({
        ...item,
        contentObj: JSON.parse(item.content),
      })),
    },
  }));

const getSyncStatus = async (itemId: string, params: object = {}) => RestfulService.get(`/item/${itemId}/syncRecord`, params)
  .then((res) => ({
    ...res,
    data: {
      ...res.data,
      data: res.data.data.map((item: IArticleSyncStatusItem) => ({
        ...item,
      })),
    },
  }));

const cancel = (msg?: string) => RestfulService.cancel(msg);

const ArticleService = {
  getAllArticlesUnderACompany,
  getArticleDetails,
  createArticleUnderACompany,
  updateArticle,
  deleteArticle,
  getArticleQrCode,
  getEditingHistory,
  getSyncStatus,
  cancel,
};

export default ArticleService;

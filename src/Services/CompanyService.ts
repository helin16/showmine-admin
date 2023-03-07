import RestfulService from './RestfulService';
import ICompany from '../Types/Company/ICompany';
import IUser from '../Types/User/IUser';
import { getFullUrl, AUTH_URL_USER_CONFIRM, getUrl } from '../UrlMap';
import Utils from './Utils';

const deleteCompany = async (companyId: string) => RestfulService.delete(`/company/${companyId}`)
  .then((res) => ({ ...res, data: formatCompanyObj(res.data) }));

const getCompanyDetails = async (companyId: string, params: object = {}) => RestfulService.get(`/company/${companyId}`, params).then((res) => ({ ...res, data: formatCompanyObj(res.data) }));

const getPackageDetails = async (companyId: string, params: object = {}) => RestfulService.get(`/company/package/${companyId}`, params);

const getPackages = async (companyId: string) => RestfulService.get(`/company/package?companyId=${companyId}`);

const getRecentVisitStats = async (companyId: string, recentDays: number, itemId?: string) => RestfulService.get(`/company/${companyId}/getItemsVisitHistory${itemId ? `?item_id=${itemId}` : ''}`, { recentDays });

const getCompanyTags = async (companyId: string) => RestfulService.get(`/company/${companyId}/tags`);

const updateCompany = async (companyId: string, company: ICompany) => RestfulService.put(`/company/${companyId}`, signBackCompanyObj(company))
  .then((res) => ({ ...res, data: formatCompanyObj(res.data) }));

const getCompanyUsers = async (companyId: string, params: object = {}) => RestfulService.get(`/company/user/${companyId}`, params);

const updateCompanyUser = async (companyId: string, userId: string, params: object = {}) => RestfulService.put(`/company/user/${companyId}/${userId}`, params);

const removeCompanyUser = async (companyId: string, userId: string) => RestfulService.delete(`/company/user/${companyId}/${userId}`);

const acceptCompanyUserInvitation = async (
  companyId: string, config: (object | undefined) = undefined,
) => RestfulService.post(`/company/user/acceptInvitation/${companyId}`, {}, config);

const approveCompanyUser = async (companyId: string, params: object = {}) => RestfulService.post(`/company/${companyId}/approveCompanyStaff`, params);
const getInviteCompanyUserQrCode = async (companyId: string) => RestfulService.post(`/company/${companyId}/genAddUserQRCode`, {
  url: getFullUrl(getUrl(AUTH_URL_USER_CONFIRM, ':companyId', companyId)),
});

const getAvailablePackages = async (companyId: string) => RestfulService.post('/company/package', {
  companyId,
});

const formatCompanyObj = (company: ICompany) => ({
  ...company,
  adminConfigObj: Utils.isJSON(company.admin_config) ? JSON.parse(company.admin_config) : company.admin_config,
  configObj: Utils.isJSON(company.config) ? JSON.parse(company.config) : company.config,
});

const signBackCompanyObj = (company: ICompany) => ({
  ...company,
  admin_config: company.adminConfigObj ? JSON.stringify(company.adminConfigObj) : company.admin_config,
  config: company.configObj ? JSON.stringify(company.configObj) : company.config,
});

const isUserCompanyAdmin = (user?: IUser | null, company?: ICompany | null) => (user && company && company.id && user.adminOfCompanyIds.indexOf(company.id) >= 0);

const isUserSuperAdmin = (user?: IUser | null) => (user && user.is_admin === true);

const getAllCompanies = async () => RestfulService.get('/company')
  .then((res) => ({ ...res, data: res.data.map((company: ICompany) => formatCompanyObj(company)) }));

const getInvoice = async (companyId: string) => RestfulService.get(`/company/${companyId}/invoice`);

const createSetupIntent = async (companyId: string) => RestfulService.get(`/company/createSetupIntent/${companyId}`);

const addPaymentMethod = async (parameters: any) => RestfulService.put(`/company/paymentMethod`, parameters) // eslint-disable-line

const updateSubscription = async (parameters: any) => RestfulService.put(`/company/subscription`, parameters) // eslint-disable-line

const CompanyService = {
  deleteCompany,
  getAllCompanies,
  getAvailablePackages,
  isUserCompanyAdmin,
  isUserSuperAdmin,
  getInviteCompanyUserQrCode,
  acceptCompanyUserInvitation,
  removeCompanyUser,
  updateCompanyUser,
  approveCompanyUser,
  getCompanyUsers,
  getCompanyDetails,
  getPackages,
  formatCompanyObj,
  getPackageDetails,
  getRecentVisitStats,
  getCompanyTags,
  updateCompany,
  getInvoice,
  createSetupIntent,
  addPaymentMethod,
  updateSubscription,
};


export default CompanyService;

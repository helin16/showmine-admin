import RestfulService from './RestfulService';
import CompanyService from './CompanyService';
import LocalStorageService from './LocalStorageService';
import { LOCAL_STROAGE_KEY_FOR_TOKEN } from '../Constants';
import { initialCompany } from '../Types/Company/ICompany';
import IUser from '../Types/User/IUser';

const setLocalAuthToken = (authToken: string) => {
  LocalStorageService.set(
    LOCAL_STROAGE_KEY_FOR_TOKEN,
    authToken,
  );
};

const getLocalAuthToken = () => {
  const token = LocalStorageService.get(LOCAL_STROAGE_KEY_FOR_TOKEN);
  return typeof (token) !== 'string' ? '' : token;
};

const removeLocalAuthToken = () => {
  LocalStorageService.delete(LOCAL_STROAGE_KEY_FOR_TOKEN);
};
const login = async (email: string, password: string) => RestfulService.post('/user/normal-login', { email, password });

const getMe = async (config: (object | undefined) = undefined) => RestfulService.get('/user/me', {}, config)
  .then((res) => ({
    ...res,
    data: {
      ...res.data,
      last_visit_company: (
        (res.data.last_visit_company && res.data.last_visit_company !== null)
          ? CompanyService.formatCompanyObj(res.data.last_visit_company) : initialCompany
      ),
    },
  }));

const putMe = async (user: IUser) => RestfulService.put('/user/me', user);

const confirmEmail = async (token: string, newEmail: string) => RestfulService.post('/user/confirm-email', { token, newEmail });

const getWeChatLoginUrl = async (data: object = {}) => RestfulService.post('/user/generateLoginSubscribeQr', data);

const checkWeChatLoginUser = async (subscribeLoginLogId: string) => RestfulService.get(`/user/checkSubscribeLoginLog/${subscribeLoginLogId}`);

const validateTmpLoginCode = async (code: string) => RestfulService.post('/user/validateLoginCode', { login_code: code });

const signUp = async (params: {companyName: string, password: string, email: string}) => RestfulService.post('/company/apply', { ...params, comfirm: params.password, phone: 'not provided' });

const retrievePassword = async (email: string) => RestfulService.post('/user/send-reset-email', { email });

const resetPassword = (tempToken: string, newPassword: string) => RestfulService.post('/user/new-password', { password: newPassword }, {
  headers: RestfulService.getAuthorizationHeader(tempToken),
});

const cancel = (msg?: string) => {
  RestfulService.cancel(msg);
};

const getFacebookLoginUrl = async () => RestfulService.get('/social-login/facebook');

const AuthService = {
  signUp,
  login,
  getMe,
  putMe,
  cancel,
  getWeChatLoginUrl,
  checkWeChatLoginUser,
  validateTmpLoginCode,
  retrievePassword,
  resetPassword,
  setLocalAuthToken,
  getLocalAuthToken,
  removeLocalAuthToken,
  confirmEmail,
  getFacebookLoginUrl,
};

export default AuthService;

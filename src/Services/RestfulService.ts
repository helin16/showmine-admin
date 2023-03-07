import axios from 'axios';
import LocalStorageService from './LocalStorageService';
import { LOCAL_STROAGE_KEY_FOR_TOKEN, REQUEST_HEADER_TOKEN_PREFIX } from '../Constants';

const restApiEndPoint = process.env.REACT_APP_REST_END_POINT;
/**
 *
 */
class RestfulService {
  defaultOptions = {};

  options: {};

  cancelSource: any = {}; // eslint-disable-line

  /**
   *
   * @param options
   */
  constructor(options?: object) {
    this.options = { ...this.defaultOptions, options };
    const cancelToken = axios.CancelToken;
    this.cancelSource = cancelToken.source();
  }

  /**
   *
   */
  private addOAuthToken = () => {
    const authHeaderObj = this.getAuthorizationHeader();
    if (authHeaderObj !== null) {
      axios.defaults.headers.common.authorization = authHeaderObj.authorization;
    }
  }

  /**
   *
   */
  private getCancelSource = () => this.cancelSource

  /**
   *
   * @param config
   */
  private getConfig = (config: object = {}) => {
    this.addOAuthToken();
    return {
      ...config,
      cancelToken: this.cancelSource.token,
    };
  }

  /**
   *
   * @param url
   * @param data
   */
  get = async (url: string, data: object = {}, config?: object) => axios.get(
    `${restApiEndPoint}${url}`,
    config || this.getConfig({ params: data }),
  )

  /**
   *
   * @param url
   * @param data
   */
  put = async (url: string, data: object, config?: object) => axios.put(
    `${restApiEndPoint}${url}`,
    data,
    config || this.getConfig(),
  )

  /**
   *
   * @param url
   * @param data
   */
  post = async (url: string, data: object, config?: object) => axios.post(
    `${restApiEndPoint}${url}`,
    data,
    config || this.getConfig(),
  )

  /**
   *
   * @param url
   */
  delete = async (url: string, config?: object) => axios.delete(
    `${restApiEndPoint}${url}`,
    config || this.getConfig(),
  )

  /**
   *
   * @param url
   * @param data
   */
  patch = async (url: string, data: object, config?: object) => axios.patch(
    `${restApiEndPoint}${url}`,
    data,
    config || this.getConfig(),
  )

  getApiEndPoint = () => restApiEndPoint

  getAuthorizationHeader = (tmpToken?: string) => {
    const token = tmpToken || LocalStorageService.get(LOCAL_STROAGE_KEY_FOR_TOKEN);
    if (!token) {
      return null;
    }
    return {
      authorization: `${REQUEST_HEADER_TOKEN_PREFIX} ${token}`,
    };
  }

  /**
   *
   * @param msg
   */
  cancel = (msg?: string) => {
    const source = this.getCancelSource();
    source.cancel(msg);
  }
}

/**
 *
 */
const service = new RestfulService();
export default service;

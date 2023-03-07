import IResList from '../Types/IResList';

const camelcase = (str: string) => str.replace(
  /\W+(.)/g,
  (match, chr) => chr.toUpperCase(),
);

const validateEmailFormat = (email: string) => {
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return regex.test(email);
};

const validateUrl = (url: string) => {
  const regex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
  return regex.test(url);
};

// eslint-disable-next-line
const groupArrayByKey = <T>(arr: T[], key: string) => arr.reduce((memo: any, x: any) => {
  if (!memo[x[key]]) {
    memo[x[key]] = []; // eslint-disable-line
  }
  memo[x[key]].push(x);
  return memo;
}, {});

// eslint-disable-next-line
const convertArrayToObject = <T>(array: T[], key: string): any => array.reduce((result, item) => {
  // @ts-ignore
  result[item[key]] = item; // eslint-disable-line
  return result;
}, {});

const translateChannelType = (type: string) => {
  if (type === 'groupmessage') {
    return 'WeChat Group';
  }
  if (type === 'singlemessage') {
    return 'WeChat User';
  }
  if (type === 'timeline') {
    return 'WeChat Moments';
  }
  return type;
};

const stripHTMLTags = (html: string) => html.replace(/(<([^>]+)>)/gi, '');

const formatCurrency = (number: number, decimals: number = 2) => number.toFixed(decimals).replace(/\d(?=(\d{3})+\.)/g, '$&,');

const concatIRestList = <T>(originalList: IResList<T>, newList: IResList<T>) => ({
  ...newList,
  data: originalList.data.concat(newList.data),
});

const compareArrays = (array1: string[]|undefined, array2: string[]|undefined) => {
  if (array1 === array2) {
    return true;
  }
  if (!array1 || !array2) {
    return false;
  }
  return array1.sort().toString() === array2.sort().toString();
};

const getUrlParameter = (strValue: string) => {
  const name = strValue.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]'); // eslint-disable-line
  const regex = new RegExp(`[\\?&]${name}=([^&#]*)`);
  const results = regex.exec(window.location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

const isJSON = (strValue: string) => {
  try {
    return (JSON.parse(strValue) && !!strValue);
  } catch (e) {
    return false;
  }
};

const Utils = {
  validateUrl,
  validateEmailFormat,
  formatCurrency,
  concatIRestList,
  stripHTMLTags,
  convertArrayToObject,
  camelcase,
  groupArrayByKey,
  translateChannelType,
  compareArrays,
  getUrlParameter,
  isJSON,
};


export default Utils;

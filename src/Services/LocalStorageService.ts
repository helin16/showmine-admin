const localStorageKey = 'shlocal';

class LocalStorageService {
  static get = (key: string): object => {
    const obj = LocalStorageService.getLocalObj();
    if (!(key in obj)) {
      return {};
    }
    // @ts-ignore
    return obj[key];
  }

  static set = (key: string, value: object | string): void => {
    const obj = LocalStorageService.getLocalObj();
    LocalStorageService.setLocalObj({
      ...obj,
      [key]: value,
    });
  }

  static delete = (key: string): void => {
    const obj = LocalStorageService.getLocalObj();
    // @ts-ignore
    delete obj[key];
    LocalStorageService.setLocalObj(obj);
  }

  static clear = (): void => {
    LocalStorageService.setLocalObj({});
  }

  private static getLocalObj = (): object => {
    const item: null|string = localStorage.getItem(`${localStorageKey}`);
    if (item === null) {
      return {};
    }
    return JSON.parse(item);
  }

  private static setLocalObj = (value: object): void => {
    localStorage.setItem(`${localStorageKey}`, JSON.stringify(value));
  }
}

export default LocalStorageService;

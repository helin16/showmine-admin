import RestfulService from './RestfulService';

const setLastVisitCompany = async (params: object = {}) => RestfulService.put('/user/me/setLastVisitCompany', params);

const UserService = {
  setLastVisitCompany,
};

export default UserService;

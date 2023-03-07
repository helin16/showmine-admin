import RestfulService from './RestfulService';

const endPoint = '/company/channelConfig';
const getChannelsUnderCompany = async (companyId: string, params: object = {}) => RestfulService.get(`${endPoint}/${companyId}`, { ...params, showAll: true });

const getChannelDetails = async (id: string) => RestfulService.get(`${endPoint}/${id}`);

const createChannel = async (params: object) => RestfulService.post(endPoint, params);

const updateChannel = async (channelId: string, params: object) => RestfulService.put(`${endPoint}/${channelId}`, params);

const deleteChannel = async (channelId: string) => RestfulService.delete(`${endPoint}/${channelId}`);

const ChannelService = {
  getChannelDetails,
  createChannel,
  updateChannel,
  deleteChannel,
  getChannelsUnderCompany,
};

export default ChannelService;

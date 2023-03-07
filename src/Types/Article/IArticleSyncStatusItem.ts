import IBaseModel from '../IBaseModel';
import IChannel from '../Channel/IChannel';

interface IArticleSyncStatusItem extends IBaseModel{
  item_id: string, // eslint-disable-line
  status: string,
  channel: IChannel,
  updated_at: string, // eslint-disable-line
  message: string,
  key: string,
}

export default IArticleSyncStatusItem;

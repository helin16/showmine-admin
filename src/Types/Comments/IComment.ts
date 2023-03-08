import IBaseModel from '../IBaseModel';
import IReply from './IReply';
import IArticle from '../Article/IArticle';
import IUser from '../User/IUser';

interface IComment extends IBaseModel {
  item_id: string, // eslint-disable-line
  comments: string,
  root_id?: string, // eslint-disable-line
  parent?: string,
  position?: string,

  is_private: boolean, // eslint-disable-line
  is_broadcast: boolean, // eslint-disable-line
  is_normal_comments: boolean, // eslint-disable-line
  is_received: boolean, // eslint-disable-line

  quantity: number,
  external_parent_id?: string | null, // eslint-disable-line
  out_order_num?: number | null, // eslint-disable-line
  config?: number | null,
  channel?: object, // this needs to be defined for IChannel
  channel_id?: string, // eslint-disable-line
  channel_comment_id?: string, // eslint-disable-line

  children: [],
  replys: Array<IReply>,
  item?: IArticle,

  created_by: IUser // eslint-disable-line
}

export default IComment;

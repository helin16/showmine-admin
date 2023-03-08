import IComment from './IComment';
import IUser from '../User/IUser';

interface IReply extends IComment {
  reply_to: IUser // eslint-disable-line
}

export default IReply;

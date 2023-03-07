import IArticle from '../Article/IArticle';
import IUser from '../User/IUser';

type IStatsItem = {
  from: string,
  sharer_id: string, // eslint-disable-line
  sharer: null | IUser,
  total: number,
  item: IArticle,
  date: string,
}

export default IStatsItem;

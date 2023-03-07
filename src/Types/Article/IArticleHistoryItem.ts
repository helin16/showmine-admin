import IBaseModel from '../IBaseModel';
import IArticle from './IArticle';

interface IArticleHistoryItem extends IBaseModel{
  item_id: string, // eslint-disable-line
  content: string,
  contentObj?: IArticle,
}

export default IArticleHistoryItem;

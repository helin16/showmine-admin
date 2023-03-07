import IBaseModel from '../IBaseModel';
import IArticle from '../Article/IArticle';

interface IMedia extends IBaseModel {
  id: string,
  mime_type: string, // eslint-disable-line
  comment: string | null,
  url: string,
  file_size: number, // eslint-disable-line
  items: IArticle[],
}

export default IMedia;

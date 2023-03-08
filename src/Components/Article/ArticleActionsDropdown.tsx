import React from 'react';
import IArticle from '../../Types/Article/IArticle';
import ArticleDeleteBtn from './Buttons/ArticleDeleteBtn';
import ArticlePreviewBtn from './Buttons/ArticlePreviewBtn';
import ArticleStatsBtn from './Buttons/ArticleStatsBtn';
import ArticleHistoryBtn from './Buttons/ArticleHistoryBtn';
import ArticleSyncBtn from './Buttons/ArticleSyncBtn';
import translate from '../../i18n/translate';
import Icons from '../Icons';
import Menu from '../Form/Menu';
import Dropdown from '../Form/Dropdown';
import Button, {iButton} from '../Form/Button';

const ArticleActionsDropdown = ({ article, onChanged, ...props }: {article?: IArticle, onChanged?: Function} & iButton) => {

  const handleChanged = (content: IArticle) => {
    if (typeof (onChanged) === 'function') {
      onChanged(content);
    }
  };

  if (!article) {
    return null;
  }

  const menu = (
    <Menu items={[
      { label: <ArticlePreviewBtn article={article} type={'text'} icon={<Icons.EyeOutlined />} />, key: 0},
      { label: <ArticleStatsBtn article={article} type={'text'} icon={<Icons.AreaChartOutlined />} />, key: 1},
      { label: <ArticleSyncBtn article={article} type={'text'} icon={<Icons.OrderedListOutlined />} />, key: 2},
      { label: <ArticleHistoryBtn article={article} type={'text'} icon={<Icons.EyeOutlined />} />, key: 3},
      { label: <ArticleDeleteBtn article={article} onDeleted={handleChanged} type={'primary'} icon={<Icons.DeleteOutlined />} danger block/>, key: 4},
    ]} />
  );
  return (
    <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
      <Button {...props} className="ant-dropdown-link">
        {props.children || (<div>{ translate('options')}<Icons.DownOutlined /></div>) }
      </Button>
    </Dropdown>
  );
};

export default ArticleActionsDropdown;

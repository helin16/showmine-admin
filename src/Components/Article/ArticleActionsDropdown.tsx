import React from 'react'
import IArticle from '../../Types/Article/IArticle'
import ArticleDeleteBtn from './Buttons/ArticleDeleteBtn'
import ArticlePreviewBtn from './Buttons/ArticlePreviewBtn'
import ArticleStatsBtn from './Buttons/ArticleStatsBtn'
import ArticleHistoryBtn from './Buttons/ArticleHistoryBtn'
import ArticleSyncBtn from './Buttons/ArticleSyncBtn'
import Icons from '../Icons'
import Dropdown from '../Form/Dropdown'
import Button, { iButton } from '../Form/Button'
import ArticleUnPublishBtn from './Buttons/ArticleUnPublishBtn';
import {useIntl} from 'react-intl';
import ArticleMoreOptionsBtn from './Buttons/ArticleMoreOptionsBtn';
import styled from 'styled-components';
import { APP_WIDTHS } from '../../Constants'

const Wrapper = styled.div`
  .more-opts-btn {
    display: none;
  }
  // @media only screen and (max-width: ${APP_WIDTHS.xs}) {
  //   .more-opts-btn {
  //     display: block;
  //   }
  // }
`;

type iArticleActionsDropdown = { article?: IArticle; onChanged?: (article: IArticle) => void } & iButton
const ArticleActionsDropdown = ({
  article,
  onChanged,
  ...props
}: iArticleActionsDropdown) => {
  const intl = useIntl();
  const handleChanged = (content: IArticle) => {
    if (typeof onChanged === 'function') {
      onChanged(content)
    }
  }
  const getMenuItems = () => {
    return [
      // eslint-disable-next-line react/jsx-key
      <ArticleUnPublishBtn article={article} type={'text'} icon={<Icons.AuditOutlined />} onUpdated={handleChanged} />,
      // eslint-disable-next-line react/jsx-key
      <ArticlePreviewBtn article={article} type={'text'} icon={<Icons.EyeOutlined />} />,
      // eslint-disable-next-line react/jsx-key
      <ArticleStatsBtn article={article} type={'text'} icon={<Icons.AreaChartOutlined />} />,
      // eslint-disable-next-line react/jsx-key
      <ArticleMoreOptionsBtn
        article={article}
        type={'text'}
        icon={<Icons.LinkOutlined />}
        className={'more-opts-btn'}
        onUpdated={handleChanged}
      />,
      // eslint-disable-next-line react/jsx-key
      <ArticleSyncBtn article={article} type={'text'} icon={<Icons.OrderedListOutlined />} />,
      // eslint-disable-next-line react/jsx-key
      <ArticleHistoryBtn article={article} type={'text'} icon={<Icons.EyeOutlined />} />,
      // eslint-disable-next-line react/jsx-key
      <ArticleDeleteBtn
        article={article}
        onDeleted={handleChanged}
        type={'primary'}
        icon={<Icons.DeleteOutlined />}
        danger
        block
      />,
    ]
  }

  if (!article) {
    return null
  }

  return (
    <Wrapper>
      <Dropdown menu={{
        items: getMenuItems().map((item, index) => ({label: item, key: index}))
      }} trigger={['click']} placement='bottomRight'>
        <Button {...props} className='ant-dropdown-link'>
          {props.children || (
            <div>
              {intl.formatMessage({ id: 'options' })}
              <Icons.DownOutlined />
            </div>
          )}
        </Button>
      </Dropdown>
    </Wrapper>
  )
}

export default ArticleActionsDropdown

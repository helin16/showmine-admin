import React from 'react';
import styled from 'styled-components';
import IArticle from '../../Types/Article/IArticle';
import UserAvatar from '../User/UserAvatar';
import ArticleCoverImg from './ArticleCoverImg';
import ArticleDraftImg from './ArticleDraftImg';
import moment from 'moment';
import Card, {CardMeta} from '../Form/Card';

export const articleStatusIconZIndex = 999;

const CaptionDiv = styled.div`
`;
const DescriptionDiv = styled.div`
  margin-top: 12px;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;
const coverImgStyle = {
  width: '100%',
  height: '180px',
};
const StatusWrapper = styled.div`
  position: relative;
  z-index: ${articleStatusIconZIndex};
`;
const StatusDiv = styled.div`
  position: absolute;
  top: -10px;
  right: -10px;
`;
const statusImgStyle = {
  width: '50px',
  height: '50px',
  objectFit: 'contain',
};

type iArticleCard = {article: IArticle, className?: string};
const ArticleCard = ({ article, className }: iArticleCard) => {
  const meta = <>
    <small>
      {
        article.seller?.nick_name // eslint-disable-line
      }
    </small>
    <div style={{ fontSize: '11px', color: '#ccc' }}>
      <small>
        { moment(article.created_at).format('ll') }
      </small>
    </div>
  </>;

  const coverDiv = <div className={'article-cover-img-div'}>
    { article.is_draft === 1 // eslint-disable-line
      ? <StatusWrapper>
        <StatusDiv><ArticleDraftImg style={statusImgStyle}/></StatusDiv>
      </StatusWrapper>
      : ''
    }
    <ArticleCoverImg article={article} style={coverImgStyle}/>
  </div>;

  return (
    <Card hoverable key={article.id} cover={coverDiv} className={className}>
      <CaptionDiv>
        <CardMeta
          avatar={<UserAvatar user={article.seller} size={'large'}/>}
          title={meta}
        />
        <DescriptionDiv>
          {article.title}
        </DescriptionDiv>
      </CaptionDiv>
    </Card>
  );
};

export default ArticleCard;

import React from 'react'
import styled from 'styled-components'
import IArticle from '../../Types/Article/IArticle'
import UserAvatar from '../User/UserAvatar'
import ArticleCoverImg from './ArticleCoverImg'
import ArticleDraftImg from './ArticleDraftImg'
import moment from 'moment'
import Card, { CardMeta } from '../Form/Card'

export const articleStatusIconZIndex = 999

const CaptionDiv = styled.div``
const DescriptionDiv = styled.div`
  margin-top: 12px;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`
const StatusDiv = styled.div`
  position: absolute;
  top: -10px;
  right: -10px;
`
const statusImgStyle = {
  width: '50px',
  height: '50px',
  objectFit: 'contain',
}

const Wrapper = styled.div`
  cursor: pointer;
  .cover-img {
    width: 100%;
    height: 180px;
    .cover-img-div {
      background-size: cover;
      background-position: center center;
      background-repeat: no-repeat;
    }
  }
  .status-wrapper {
    position: relative;
    z-index: ${articleStatusIconZIndex};
  }
`;

type iArticleCard = { article: IArticle; className?: string }
const ArticleCard = ({ article, className }: iArticleCard) => {
  const meta = <>
    <small>
      {
        article.CreatedBy?.nickName || ''
      }
    </small>
    <div style={{ fontSize: '11px', color: '#ccc' }}>
      <small>
        { moment(article.createdAt).format('ll') }
      </small>
    </div>
  </>;

  const coverDiv = <div className={'article-cover-img-div'}>
    { article.isPublished !== true
      ? <div className={'status-wrapper'}>
        <StatusDiv><ArticleDraftImg style={statusImgStyle} /></StatusDiv>
      </div>
      : ''
    }
    <ArticleCoverImg article={article} imgWrapperProps={{className: 'cover-img'}} />
  </div>;

  return (
    <Wrapper>
      <Card hoverable key={article.id} cover={coverDiv} className={className}>
        <CaptionDiv>
          <CardMeta
            avatar={<UserAvatar user={article.CreatedBy} size={'large'}/>}
            title={meta}
          />
          <DescriptionDiv>
            {article.title}
          </DescriptionDiv>
        </CaptionDiv>
      </Card>
    </Wrapper>
  );
}

export default ArticleCard

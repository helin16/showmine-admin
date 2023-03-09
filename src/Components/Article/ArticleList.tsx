import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import IArticle, {iSearchCriteria} from '../../Types/Article/IArticle';
import ArticleService from '../../Services/ArticleService';
import LoadMoreBtn from '../Form/LoadMoreBtn';
import { listGutter} from '../../Styles/AppWrapper';
import { ARTICLE_DETAILS_URL, getUrl } from '../../UrlMap';
import {initError} from '../../Types/IError';
import {InitialList} from '../../Types/IResList';
import List, {ListItem} from '../Form/List';
import Dropdown from '../Form/Dropdown';
import ArticleDeleteBtn from './Buttons/ArticleDeleteBtn';
import Icons from '../Icons';
import ArticleCard from './ArticleCard';
import styled from 'styled-components';

const defaultSearchCriteria: iSearchCriteria = {
  is_draft: 0, // eslint-disable-line
  is_end: 0, // eslint-disable-line
  is_published: 0, // eslint-disable-line
  'key-word': '',
};

const initialState = {
  initLoading: false,
  loadingMore: false,
  loadingErr: initError,
  articleList: InitialList,
  searchParams: defaultSearchCriteria,
  page: 0,
  pageSize: 12,
};
type iArticleList = {
  companyId?: string,
  searchParams?: iSearchCriteria
};
const Wrapper = styled.div`
  .article-item {
    .article-cover-img-div {
      .ant-image {
        .ant-image-img {
          border-radius: 0px;
          object-fit: cover;
          display: block;
          height: 180px;
          min-width: 300px;
        }
      }
    }
  }
`;
const ArticleList = ({ companyId, searchParams }: iArticleList) => {
  const [state, setState] = useState(initialState);
  /**
   * searchParams changed
   */
  useEffect(() => {
    if (!companyId) return;
    setState({
      ...initialState,
      searchParams: searchParams || defaultSearchCriteria,
      page: 1,
    });
  }, [searchParams, companyId]);
  /**
   * getting the articles
   */
  useEffect(() => {
    if (state.page <= 0 || `${companyId || ''}`.trim() === '') {
      return;
    }
    let isCancelled = false;
    setState((st) => ({
      ...st,
      initLoading: st.page === 1,
      loadingErr: initError,
    }));
    ArticleService.getAllArticlesUnderACompany(`${companyId || ''}`, { ...state.searchParams, page: state.page, 'page-size': state.pageSize })
      .then((res) => {
        if (!isCancelled) {
          setState((st) => ({
            ...st,
            articleList: {
              ...res.data,
              data: st.articleList.data.concat(res.data.data),
            },
            initLoading: false,
            loadingMore: false,
          }));
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setState((st) => ({
            ...st,
            loadingErr: error.data,
            initLoading: false,
            loadingMore: false,
          }));
        }
      });
    // clean up
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [companyId, state.searchParams, state.page, state.pageSize]);

  /**
   * loading more results
   */
  const loadMore = () => {
    setState({
      ...state,
      loadingMore: true,
      page: state.page + 1,
    });
  };

  const handleDeleted = (deletedArticle: IArticle) => {
    setState({
      ...state,
      articleList: {
        ...state.articleList,
        data: state.articleList.data.filter((item: IArticle) => item.id !== deletedArticle.id),
      },
    });
  };

  if (companyId === undefined) {
    return null;
  }

  return (
    <Wrapper>
      <List
        className="article-list"
        loading={state.initLoading}
        loadMore={
          <LoadMoreBtn
            onClick={loadMore}
            loading={state.loadingMore}
            showing={
               !state.initLoading
               && (state.articleList.current_page < state.articleList.last_page)
            }
          />
        }
        grid={{
          gutter: listGutter,
          xs: 1,
          sm: 2,
          md: 3,
          lg: 4,
          xl: 4,
          xxl: 6,
        }}
        dataSource={state.articleList.data}
        renderItem={(article: IArticle) => (
          <ListItem>
            <Dropdown
              menu={{
                items: [{
                  label: <ArticleDeleteBtn article={article} onDeleted={handleDeleted}
                    icon={<Icons.DeleteOutlined />}
                    danger
                    type={'primary'}
                  />,
                  key: 0,
                }]
              }}
              trigger={['contextMenu']}>
              <Link to={getUrl(ARTICLE_DETAILS_URL, ':id', article.id)}>
                <ArticleCard article={article} key={article.id} className={'article-item'}/>
              </Link>
            </Dropdown>
          </ListItem>
        )}
      />
    </Wrapper>
  );
};

export default ArticleList;

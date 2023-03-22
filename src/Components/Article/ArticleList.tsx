import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import IArticle from '../../Types/Article/IArticle'
import ArticleService from '../../Services/ArticleService'
import LoadMoreBtn from '../Form/LoadMoreBtn'
import { listGutter } from '../../Styles/AppWrapper'
import { ARTICLE_DETAILS_URL, getUrl } from '../../UrlMap'
import List, { ListItem } from '../Form/List'
import Dropdown from '../Form/Dropdown'
import ArticleDeleteBtn from './Buttons/ArticleDeleteBtn'
import Icons from '../Icons'
import ArticleCard from './ArticleCard'
import styled from 'styled-components'
import IResList from '../../Types/IResList'
import ICompany from '../../Types/Company/ICompany';
import {iSearchParams} from '../../Pages/Article/ArticleListPage';
import {OP_LIKE} from '../../Helpers/ServiceHelper';
import message from '../Form/message';


type iState = {
  initLoading: boolean
  loadingMore: boolean
  searchParams: iSearchParams
  page: number
  pageSize: number
  articleList?: IResList<IArticle>
}
const initialState: iState = {
  initLoading: false,
  loadingMore: false,
  searchParams: {keyWord: '', extraStatus: {}},
  page: 0,
  pageSize: 12,
}
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
`
type iArticleList = {
  company: ICompany;
  searchParams?: iSearchParams;
}
const ArticleList = ({ company, searchParams }: iArticleList) => {
  const [state, setState] = useState(initialState);

  /**
   * searchParams changed
   */
  useEffect(() => {
    if (`${company.id || ''}`.trim() === '') return;
    setState({
      ...initialState,
      ...(searchParams ? {searchParams} : {}),
      page: 1,
    });
  }, [JSON.stringify(searchParams), company.id]);
  /**
   * getting the articles
   */
  useEffect(() => {
    const companyId = `${company.id || ''}`.trim();
    if (state.page <= 0 || companyId === '') {
      return;
    }
    let isCancelled = false;
    setState((st) => ({
      ...st,
      initLoading: st.page === 1,
      loadingMore: st.page > 1,
    }));
    ArticleService.getAll({
        perPage: state.pageSize,
        currentPage: state.page,
        sort: 'createdAt:DESC',
        where: JSON.stringify({
          isActive: true,
          ...state.searchParams?.extraStatus,
          ...(`${state.searchParams.keyWord || ''}`.trim() === '' ? {} : {
            title: {[OP_LIKE]: `%${`${state.searchParams.keyWord || ''}`.trim()}%`}
          })
        }),
        include: 'CoverAsset,CreatedBy'
      })
      .then((res) => {
        if (!isCancelled) {
          setState((st) => ({
            ...st,
            articleList: {
              ...res,
              data: (st.articleList?.data || []).concat(res.data),
            },
          }));
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setState((st) => ({
            ...st,
            initLoading: false,
            loadingMore: false,
          }));
        }
        message.error(error.response.data.message);
      })
      .finally(() => {
        setState((st) => ({
          ...st,
          initLoading: false,
          loadingMore: false,
        }));
      });
    // clean up
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [company.id, state.searchParams, state.page, state.pageSize]);
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
    if (!state.articleList) {
      return;
    }
    setState({
      ...state,
      articleList: {
        ...state.articleList,
        data: (state.articleList?.data || []).filter((item: IArticle) => item.id !== deletedArticle.id),
      },
    });
  };

  if (!company || !company.id) {
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
               && ((state.articleList?.currentPage || 0) < (state.articleList?.pages || 0))
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
        dataSource={state.articleList?.data || []}
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

}

export default ArticleList

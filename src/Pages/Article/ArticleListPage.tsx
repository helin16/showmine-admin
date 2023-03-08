import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { RootState } from '../../Redux/makeReduxStore';
import { ARTICLE_DETAILS_URL, getUrl } from '../../UrlMap';
import {contentInternalMargin} from '../../Styles/AppWrapper';
import BackendPage from '../../Layouts/BackendPage';
import {MENU_KEY_ARTICLES} from '../../Components/Menu/MenuItems';
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle';
import Icons from '../../Components/Icons';
import Button from '../../Components/Form/Button';
import Search from '../../Components/Form/Search';
import Space from '../../Components/Form/Space';
import Card from '../../Components/Form/Card';
import {useNavigate} from 'react-router-dom';
import ArticleList from '../../Components/Article/ArticleList';

const SectionDiv = styled.div`
  margin: ${contentInternalMargin} 0px;
`;
const articleStatuses = {
  Published: { is_published: 1, is_draft: 0, is_end: 0 },
  Draft: { is_published: 0, is_draft: 1, is_end: 0 },
  All: { is_published: undefined, is_draft: undefined, is_end: undefined },
};
const initialState = {
  selectedStatus: 'Published',
  searchParams: {
    is_draft: 0,
    is_end: 0,
    is_published: 1,
    'key-word': '',
  },
};

/**
 * Article List Page
 */
const ArticleListPage = () => {
  const { company } = useSelector((s: RootState) => s.auth);
  const [state, setState] = useState(initialState);
  const intl = useIntl();
  const navigate = useNavigate();

  /**
   *
   * @param searchText
   */
  const search = (searchText: string) => {
    setState({
      ...state,
      searchParams: {
        ...state.searchParams,
        'key-word': searchText,
      },
    });
  };
  /**
   *
   * @param newStatus
   */
  const changeStatus = (newStatus: string) => {
    // @ts-ignore
    const newSearchParams = articleStatuses[newStatus];
    setState({
      ...state,
      selectedStatus: newStatus,
      searchParams: {
        ...initialState.searchParams,
        is_draft: newSearchParams.is_draft,
        is_end: newSearchParams.is_end,
        is_published: newSearchParams.is_end,
      },
    });
  };

  /**
   * Rendering
   */
  return (
    <BackendPage
      selectedMenu={MENU_KEY_ARTICLES}
      ContentHeader={
        <BackendPageContentTitle
          title={intl.formatMessage({ id: 'news_article' })}
          controls={
            <Button type='primary' icon={<Icons.PlusOutlined />}>
              {intl.formatMessage({ id: 'new-article' })}
            </Button>
          }
        />
      }
    >

      <Card>
        <Search
          placeholder={intl.formatMessage({ id: 'search_news' })}
          allowClear={true}
          onSearch={search}
        />
        <Space style={{ marginTop: contentInternalMargin }}>
          {Object.keys(articleStatuses).map((status, index) => {
            if (status === state.selectedStatus) {
              return (
                <Button type={'primary'} key={`btn-${index}`} shape="round" onClick={() => navigate(getUrl(ARTICLE_DETAILS_URL))}>
                  { intl.formatMessage({ id: status }) }
                </Button>
              );
            }
            return (
              <Button
                onClick={() => changeStatus(status)}
                key={`btn-${index}`}
                shape="round"
              >
                { intl.formatMessage({ id: status }) }
              </Button>
            );
          })}
        </Space>
      </Card>
      <SectionDiv>
        { company
          ? <ArticleList companyId={company.id || ''} searchParams={state.searchParams} />
          : null
        }
      </SectionDiv>
    </BackendPage>
  );
};


export default ArticleListPage;

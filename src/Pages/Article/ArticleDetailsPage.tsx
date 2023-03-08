import React, { useEffect, useState } from 'react';
import { Space, Spin, Typography } from 'antd';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useIntl } from 'react-intl';
import BackendPage from '../../Layouts/BackendPage';
import { MENU_KEY_ARTICLES } from '../../Components/Menu/MenuItems';
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle';
import ArticleEditor from '../../Components/Article/ArticleEditor';
import ArticleService from '../../Services/ArticleService';
import NewArticleGuide from '../../Components/Article/NewArticleGuide';
import { RootState } from '../../Redux/makeReduxStore';
import InvalidAccessPanel from '../../Components/Error/InvalidAccessPanel';
import ArticleActionsDropdown from '../../Components/Article/ArticleActionsDropdown';
import InvalidArticleDetails from '../../Components/Article/InvalidArticleDetails';
import ArticlePublishBtn from '../../Components/Article/ArticlePublishBtn';
import CommentsList from '../../Components/Comments/CommentsList';
import IArticle from '../../Types/Article/IArticle';
import Card from '../../Components/Form/Card';
import {useParams} from 'react-router-dom';

type iState = {
  fetching: boolean,
  article?: IArticle,
}

const initialState: iState = {
  fetching: true,
};

const ArticleDetailsPage =  () => {
  const { company } = useSelector((s: RootState) => s.auth);
  const [state, setState] = useState(initialState);
  const {id} = useParams();
  const intl = useIntl();
  const articleId = `${id || ''}`.trim();
  /**
   *
   */
  useEffect(() => {
    if (!(articleId !== '' && articleId.toLowerCase() !== 'new')) {
      setState((s) => ({
        ...s,
        fetching: false,
      }));
      return;
    }

    let isCancelled = false;
    ArticleService.getArticleDetails(articleId)
      .then((res) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          fetching: false,
          article: res.data,
        }));
      })
      .catch((err) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          fetching: false,
          fetchingErr: err.data,
        }));
      });
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [articleId]);

  const articleUpdated = (article: IArticle) => {
    setState({
      ...state,
      article,
    });
  };

  const getArticleEditor = () => {
    if (state.article !== undefined && ('id' in state.article) && state.article.id !== '') {
      return (<ArticleEditor article={state.article} onUpdated={articleUpdated}/>);
    }
    return (
      <Card>
        <NewArticleGuide />
      </Card>
    );
  };

  const getDraftSpan = () => {
    if (!state.article || state.article.is_draft !== 1) {
      return null;
    }
    return (
      <Typography.Text type={'secondary'}><small>[draft]</small></Typography.Text>
    );
  };

  if (state.article && state.article.id && (!company || state.article.company_id !== company.id)) {
    return (
      <BackendPage selectedMenu={MENU_KEY_ARTICLES}>
        <InvalidAccessPanel />
      </BackendPage>
    );
  }

  if (state.article && state.article.active !== 1) {
    return (
      <BackendPage selectedMenu={MENU_KEY_ARTICLES}>
        <InvalidArticleDetails
          status="500"
          title="Content has been deleted"
          subTitle={`This content has been deleted @ ${moment(state.article.updated_at).format('lll')}`}
        />
      </BackendPage>
    );
  }
  /**
   * render
   */
  return (
    <BackendPage selectedMenu={MENU_KEY_ARTICLES}>
      <BackendPageContentTitle
        title={!state.article ? null : <div>{intl.formatMessage({ id: 'editing' })}{getDraftSpan()}: {state.article.title}</div>}
        controls={!state.article ? null : (
          <Space>
            <ArticlePublishBtn
              article={state.article}
              type={'primary'}
              icon={<CloudUploadOutlined />}
              onPublished={articleUpdated} />
            <ArticleActionsDropdown article={state.article} onChanged={articleUpdated}/>
          </Space>
        )}
      />
      <Spin spinning={state.fetching} tip={intl.formatMessage({ id: 'loading' })}>
        {getArticleEditor()}
      </Spin>
      <Card>
        {company && `${articleId || ''}`.trim() !== ''
          ? <CommentsList itemId={articleId} />
          : null
        }
      </Card>
    </BackendPage>
  );
};

export default ArticleDetailsPage;

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import moment from 'moment'
import { useIntl } from 'react-intl'
import BackendPage from '../../Layouts/BackendPage'
import { MENU_KEY_ARTICLES } from '../../Components/Menu/MenuItems'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import ArticleEditor from '../../Components/Article/ArticleEditor'
import ArticleService from '../../Services/ArticleService'
import NewArticleGuide from '../../Components/Article/NewArticleGuide'
import { RootState } from '../../Redux/makeReduxStore'
import InvalidAccessPanel from '../../Components/Error/InvalidAccessPanel'
import ArticleActionsDropdown from '../../Components/Article/ArticleActionsDropdown'
import InvalidArticleDetails from '../../Components/Article/InvalidArticleDetails'
import ArticlePublishBtn from '../../Components/Article/ArticlePublishBtn'
import CommentsList from '../../Components/Comments/CommentsList'
import IArticle from '../../Types/Article/IArticle'
import Card from '../../Components/Form/Card'
import {useNavigate, useParams} from 'react-router-dom'
import Typography from '../../Components/Form/Typography'
import Space from '../../Components/Form/Space'
import Icons from '../../Components/Icons'
import Spin from '../../Components/Form/Spin'
import MathHelper from '../../Helpers/MathHelper'
import message from '../../Components/Form/message'
import {ARTICLE_LIST_URL} from '../../UrlMap';
import Utils from '../../Services/Utils'

type iState = {
  fetching: boolean
  article?: IArticle
  count: number
  loadFailed?: boolean
}

const initialState: iState = {
  fetching: true,
  count: 0,
}

const ArticleDetailsPage = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const [state, setState] = useState(initialState)
  const { id } = useParams();
  const intl = useIntl()
  const articleId = `${id || ''}`.trim()
  const isNewArticle = articleId === '' || articleId.toLowerCase() === 'new'
  const navigate = useNavigate();
  /**
   *
   */
  useEffect(() => {
    if (isNewArticle) {
      setState((s) => ({
        ...s,
        fetching: false,
      }))
      return
    }

    setState((s) => ({
      ...s,
      fetching: !s.article,
      loadFailed: false,
    }))
    let isCancelled = false
    ArticleService.getItemById(articleId, { include: 'CoverAsset,Author' })
      .then((res) => {
        if (isCancelled === true) return
        setState((s) => ({
          ...s,
          fetching: false,
          article: res,
        }))
      })
      .catch((err) => {
        if (isCancelled === true) return
        message.error(Utils.getErrorMessage(err))
        setState((s) => ({
          ...s,
          fetching: false,
          loadFailed: true,
        }))
      })
    return () => {
      // eslint-disable-line
      isCancelled = true
    }
  }, [articleId, state.count])

  const articleUpdated = (newArticle: IArticle) => {
    if (newArticle.isActive === false) {
      navigate(ARTICLE_LIST_URL);
      return;
    }

    setState({
      ...state,
      count: MathHelper.add(state.count, 1),
    })
  }

  const getArticleEditor = () => {
    if (state.article !== undefined && 'id' in state.article && state.article.id !== '') {
      return <ArticleEditor article={state.article} onUpdated={articleUpdated} />
    }
    if (isNewArticle) {
      return (
        <Card>
          <NewArticleGuide />
        </Card>
      )
    }
    if (state.loadFailed === true) {
      return <InvalidArticleDetails status='404' title={intl.formatMessage({ id: 'invalid-content' })} />
    }
    return null
  }

  const getCommentsDiv = () => {
    if (!company || !state.article || isNewArticle) {
      return null
    }
    return (
      <Card>
        <CommentsList itemId={articleId} />
      </Card>
    )
  }

  const getDraftSpan = () => {
    if (!state.article || state.article.isPublished === true) {
      return null
    }
    return (
      <Typography.Text type={'danger'}>
        <small>[draft]</small>
      </Typography.Text>
    )
  }

  if (state.article && state.article.id && (!company || state.article.companyId !== company.id)) {
    return (
      <BackendPage selectedMenu={MENU_KEY_ARTICLES}>
        <InvalidAccessPanel />
      </BackendPage>
    )
  }

  if (state.article && state.article.isActive !== true) {
    return (
      <BackendPage selectedMenu={MENU_KEY_ARTICLES}>
        <InvalidArticleDetails
          status='500'
          title='Content has been deleted'
          subTitle={`This content has been deleted @ ${moment(state.article.updatedAt).format('lll')}`}
        />
      </BackendPage>
    )
  }
  /**
   * render
   */
  return (
    <BackendPage
      selectedMenu={MENU_KEY_ARTICLES}
      ContentHeader={
        <BackendPageContentTitle
          title={
            !state.article ? null : (
              <div>
                {intl.formatMessage({ id: 'editing' })}: {' '}
                {state.article.title}
              </div>
            )
          }
          controls={
            !state.article ? null : (
              <Space align={'baseline'}>
                {getDraftSpan()}
                <ArticlePublishBtn
                  article={state.article}
                  type={'primary'}
                  icon={<Icons.CloudUploadOutlined />}
                  onPublished={articleUpdated}
                />
                <ArticleActionsDropdown article={state.article} onChanged={articleUpdated} />
              </Space>
            )
          }
        />
      }
    >
      <Spin spinning={state.fetching} tip={intl.formatMessage({ id: 'loading' })}>
        {getArticleEditor()}
      </Spin>

      {getCommentsDiv()}
    </BackendPage>
  )
}

export default ArticleDetailsPage

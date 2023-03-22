import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import IArticle from '../../../Types/Article/IArticle'
import ArticleService from '../../../Services/ArticleService'
import Button, { iButton } from '../../Form/Button'
import message from '../../Form/message'
import Modal from '../../Form/Modal'
import Icons from '../../Icons'

type iState = {
  showingConfirmDiv: boolean
  isSaving: boolean
}
const initialState: iState = {
  showingConfirmDiv: false,
  isSaving: false,
}

type iArticleUnPublishBtn = iButton & { article?: IArticle; onUpdated?: (updatedArticle: IArticle) => void };
const ArticleUnPublishBtn = ({
  children,
  article,
  onUpdated,
  ...props
}: iArticleUnPublishBtn) => {
  const [state, setState] = useState(initialState)
  const intl = useIntl()

  useEffect(() => {
    if (!article) return
    setState((s) => ({
      ...s,
      showingConfirmDiv: false,
    }))
  }, [article])

  const confirm = () => {
    const articleId = `${article?.id || ''}`.trim();
    if (articleId === '') return

    setState({
      ...state,
      isSaving: true,
    })
    ArticleService.update(articleId, {
      publishedAt: null,
      publishedById: null,
    })
      .then((res) => {
        message.success('Content unPublished.')
        setState({
          ...state,
          isSaving: false,
          showingConfirmDiv: false,
        })
        if (typeof onUpdated === 'function') {
          onUpdated(res)
        }
      })
      .catch((err) => {
        message.error(`Error when unPublishing: ${err.message}`)
      })
      .finally(() => {
        setState({
          ...state,
          isSaving: false,
        })
      })
  }

  const showOrHideConfirmDiv = (showing: boolean) => {
    setState({
      ...state,
      showingConfirmDiv: showing,
    })
  }

  if (!article) {
    return null
  }

  return (
    <>
      <Button
        {...props}
        onClick={() => {
          showOrHideConfirmDiv(true)
        }}
      >
        {children || intl.formatMessage({ id: 'unPublish' })}
      </Button>
      {state.showingConfirmDiv !== true ? null : (
        <Modal
          open={state.showingConfirmDiv === true}
          title={intl.formatMessage({ id: 'are_you_sure' })}
          onOk={confirm}
          okText={intl.formatMessage({ id: 'confirm' })}
          okButtonProps={{ icon: <Icons.DeleteOutlined />, loading: state.isSaving === true }}
          onCancel={() => {
            showOrHideConfirmDiv(false)
          }}
          cancelButtonProps={{ type: 'text' }}
        >
          <p>
            {intl.formatMessage({ id: 'unPublishConfirm' })}
          </p>
        </Modal>
      )}
    </>
  )
}

export default ArticleUnPublishBtn

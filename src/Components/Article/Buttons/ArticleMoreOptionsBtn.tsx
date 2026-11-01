import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import IArticle from '../../../Types/Article/IArticle'
import Button, { iButton } from '../../Form/Button'
import Drawer from '../../Form/Drawer';
import ArticleEditorSideOptions from '../ArticleEditorSideOptions';
import ArticleService from '../../../Services/ArticleService';
import {NoticeType} from 'antd/es/message/interface';
import {useMessage} from '../../Form/message';

type iState = {
  article?: IArticle;
  showingOptions: boolean;
  isSaving: boolean;

}
const initialState: iState = {
  showingOptions: false,
  isSaving: false,
}

const ArticleMoreOptionsBtn = ({ article, children, onUpdated, ...props }: iButton & { article?: IArticle, onUpdated?: (newArticle: IArticle) => void }) => {
  const [state, setState] = useState(initialState);
  const messageKey = 'more-options-savingMessage'
  const intl = useIntl();

  const [messageApi, contextHolder] = useMessage()

  const openMessage = (type: NoticeType, content: string) => {
    messageApi.open({
      key: messageKey,
      type,
      content,
    })
  }

  const handleValueChanged = (fieldName: string, newValue: string | boolean | number) => {
    if (!article?.id) {
      openMessage('error', intl.formatMessage({ id: 'invalid-content' }))
      return
    }
    setState({
      ...state,
      isSaving: true,
    })
    ArticleService.update(article.id, {
      [fieldName]: newValue,
    })
      .then((res) => {
        setState({
          ...state,
          isSaving: false,
        })
        openMessage('success', intl.formatMessage({ id: 'content-update' }));
        if (typeof onUpdated === 'function') {
          onUpdated(res)
        }
      })
      .catch((err) => {
        openMessage('error', intl.formatMessage({ id: 'error-text' }, { text: err.message }))
        setState({
          ...state,
          isSaving: false,
        })
      })
  }


  const getDrawer = () => {
    if (!article) {
      return null
    }

    return (
      <Drawer
        width={370}
        title={intl.formatMessage({ id: 'content-option' })}
        open={state.showingOptions}
        closable={true}
        onClose={() => setState({ ...state, showingOptions: false })}
      >
        <ArticleEditorSideOptions
          article={article}
          onUpdate={handleValueChanged}
        />
      </Drawer>
    )
  }

  if (!article) {
    return null
  }

  return (
    <>
      <Button
        {...props}
        onClick={() => setState({ ...state, showingOptions: true })}
      >
        {children || intl.formatMessage({ id: 'more-options' })}
      </Button>
      {contextHolder}
      {getDrawer()}
    </>
  )
}

export default ArticleMoreOptionsBtn

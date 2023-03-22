import React, { useState } from 'react'
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import { useIntl } from 'react-intl'
import IArticle from '../../Types/Article/IArticle'
import { RootState } from '../../Redux/makeReduxStore'
import ArticleEditorSideOptions from './ArticleEditorSideOptions'
import InlineRichTextEditor from '../Form/InlineRichTextEditor'
import InlineInput from '../Form/InlineInput'
import ArticleService from '../../Services/ArticleService'
import { APP_WIDTHS } from '../../Constants'
import { useMessage } from '../Form/message'
import Row from '../Form/Row'
import Col from '../Form/Col'
import Card from '../Form/Card'
import Drawer from '../Form/Drawer'
import { listGutter } from '../../Styles/AppWrapper'
import Affix from '../Form/Affix'
import Spin from '../Form/Spin'
import {NoticeType} from 'antd/es/message/interface';
import {ASSET_TYPE_ITEM_DESCRIPTION} from '../../Types/Asset/IAsset';

const ArticleEditorWrapper = styled.div`
  .floating-options {
    display: none;
  }
  @media only screen and (max-width: ${APP_WIDTHS.lg}) {
    .options {
      display: none;
    }
    .floating-options {
      display: block;
    }
  }
  @media only screen and (max-width: ${APP_WIDTHS.xs}) {
    .floating-options {
      display: none;
    }
  }
`

type iState = {
  showingOptions: boolean
  previousImgUrl?: string
  isSaving: boolean
}

const initialState: iState = {
  showingOptions: false,
  isSaving: false,
  previousImgUrl: '',
}

type iArticleEditor = {
  article: IArticle
  onUpdated?: (newArticle: IArticle) => void
}
const ArticleEditor = ({ article, onUpdated }: iArticleEditor) => {
  const { company } = useSelector((s: RootState) => s.auth)
  const [state, setState] = useState(initialState)
  const [messageApi, contextHolder] = useMessage()
  const messageKey = 'savingMessage'
  const intl = useIntl()

  const openMessage = (type: NoticeType, content: string) => {
    messageApi.open({
      key: messageKey,
      type,
      content,
    })
  }

  const handleValueChanged = (fieldName: string, newValue: string | boolean | number) => {
    if (!article.id) {
      openMessage('error', intl.formatMessage({ id: 'invalid-content' }))
      return
    }
    setState({
      ...state,
      isSaving: true,
    })
    ArticleService.update(article.id, {
      [fieldName]: newValue,
    }, {headers: ArticleService.getItemById(`${company?.id || ''}`)})
      .then((res) => {
        setState({
          ...state,
          isSaving: false,
        })
        openMessage('success', intl.formatMessage({ id: 'content-update' }))
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

  /**
   *
   */
  return (
    <ArticleEditorWrapper>
      {contextHolder}
      <Spin spinning={state.isSaving === true}>
        <Row>
          <Col xs={{ span: 24 }}>
            <Card>
              <Row>
                <Col flex={'auto'}>
                  <InlineInput
                    placeholder={intl.formatMessage({ id: 'title-article' })}
                    value={article.title}
                    onChange={(newValue: string) => handleValueChanged('title', newValue)}
                  />
                </Col>
                <Col flex={'80px'} className={'floating-options'}>
                  <Affix offsetTop={10} style={{ right: '10px', textAlign: 'right' }}>
                    <span onClick={() => setState({ ...state, showingOptions: true })} style={{ cursor: 'pointer' }}>
                      <img src={state.previousImgUrl} alt='' style={{ width: '100%', height: '100%' }} />
                    </span>
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
                  </Affix>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
        <Row gutter={listGutter}>
          <Col xs={{ span: 24 }} lg={{ span: 17 }}>
            <Card>
              <InlineRichTextEditor
                onChange={(newValue: string) => handleValueChanged('content', newValue)}
                value={article.content}
                assetType={ASSET_TYPE_ITEM_DESCRIPTION}
                placeholder={intl.formatMessage({ id: 'start-create' })}
              />
            </Card>
          </Col>
          <Col xs={{ span: 24 }} lg={{ span: 7 }} className={'options'}>
            <Card>
              <ArticleEditorSideOptions
                article={article}
                onUpdate={handleValueChanged}
                onUpdated={onUpdated}
                onSetIsSaving={(saving: boolean) =>
                  setState({
                    ...state,
                    isSaving: saving,
                  })
                }
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </ArticleEditorWrapper>
  )
}

export default ArticleEditor

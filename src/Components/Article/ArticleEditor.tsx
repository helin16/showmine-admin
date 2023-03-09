import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import IArticle, {initialArticle} from '../../Types/Article/IArticle';
import ICompany from '../../Types/Company/ICompany';
import { RootState } from '../../Redux/makeReduxStore';
import ArticleEditorSideOptions from './ArticleEditorSideOptions';
import InlineRichTextEditor from '../Form/InlineRichTextEditor';
import InlineInput from '../Form/InlineInput';
import ArticleService from '../../Services/ArticleService';
import { APP_WIDTHS } from '../../Constants';
import {useMessage} from '../Form/message';
import Row from '../Form/Row';
import Col from '../Form/Col';
import Card from '../Form/Card';
import Drawer from '../Form/Drawer';
import {listGutter} from '../../Styles/AppWrapper';
import Affix from '../Form/Affix';
import Spin from '../Form/Spin';

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
`;

type iState = {
  company?: ICompany,
  showingOptions: boolean,
  previousImgUrl?: string,
  isSaving: boolean;
}

const initialState: iState = {
  showingOptions: false,
  isSaving: false,
  previousImgUrl: '',
};

type iArticleEditor = {
  article: IArticle;
  onUpdated?: (newArticle: IArticle) => void;
}
const ArticleEditor = ({ article, onUpdated }: iArticleEditor) => {
  const { company } = useSelector((s: RootState) => s.auth);
  const [state, setState] = useState(initialState);
  const [messageApi, contextHolder] = useMessage();
  const messageKey = 'savingMessage';
  const intl = useIntl();

  /**
   *
   */
  useEffect(() => {
    const objectKeys = article.images_in_diff_sizes ? Object.keys(article.images_in_diff_sizes?.smallImages) : [];
    setState((s) => ({
      ...s,
      article: article || initialArticle,
      previousImgUrl: objectKeys.length > 0 ? article.images_in_diff_sizes?.smallImages[objectKeys[0]].url : '',
      company: company || undefined,
    }));
  }, [article, company]);

  const openMessage = (type: string, content: string) => {
    messageApi.open({
      messageKey,
      // @ts-ignore
      type,
      content,
    })
  }

  const handleValueChanged = (fieldName: string, newValue: any) => {
    if (!article.id) {
      openMessage('error', intl.formatMessage({ id: 'invalid-content' }));
      return;
    }
    setState({
      ...state,
      isSaving: true,
    });
    const newExcerptObj = (`${fieldName}`.trim().toLowerCase() === 'excerpt' ? {
      customiseExcerpt: `${newValue || ''}`.trim() === '' ? 0 : 1,
    } : {});
    const extraConfig = (`${fieldName}`.trim() === 'configObj' ? {
      config: JSON.stringify(newValue),
    }: {});
    // openMessage('loading', intl.formatMessage({ id: 'saving' }));
    // @ts-ignore
    ArticleService.updateArticle(article.id, {
      is_draft: article.is_draft,
      date_expiry: article.date_expiry,
      address: article.address,
      company_id: article.company_id,
      ...newExcerptObj,
      ...extraConfig,
      [fieldName]: newValue,
    }).then((res) => {
        setState({
          ...state,
          isSaving: false,
        });
        openMessage('success', intl.formatMessage({ id: 'content-update' }));
        if (typeof (onUpdated) === 'function') {
          onUpdated(res.data);
        }
      })
      .catch((err) => {
        openMessage('error', intl.formatMessage({ id: 'error-text' }, { text: err.message }));
        setState({
          ...state,
          isSaving: false,
        });
      });
  };

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
                      <img src={state.previousImgUrl} alt='' style={{ width: '100%', height: '100%' }}/>
                    </span>
                    <Drawer
                      width={370}
                      title={intl.formatMessage({ id: 'content-option' })}
                      open={state.showingOptions}
                      closable={true}
                      onClose={() => setState({ ...state, showingOptions: false }) }
                    >
                      {!state.company ? null : (
                        <ArticleEditorSideOptions
                          article={article}
                          company={state.company}
                          onUpdate={handleValueChanged}
                        />
                      )}
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
                onChange={(newValue: string) => handleValueChanged('description', newValue)}
                value={article.description}
                placeholder={intl.formatMessage({ id: 'start-create' })}
              />
            </Card>
          </Col>
          <Col xs={{ span: 24 }} lg={{ span: 7 }} className={'options'}>
            <Card>
              {!state.company ? null : (
                <ArticleEditorSideOptions
                  article={article}
                  company={state.company}
                  onUpdate={handleValueChanged}
                  onUpdated={onUpdated}
                  onSetIsSaving={(saving: boolean) => setState({
                    ...state,
                    isSaving: saving,
                  })}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </ArticleEditorWrapper>
  );
};

export default ArticleEditor;

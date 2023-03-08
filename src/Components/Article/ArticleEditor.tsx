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
import message from '../Form/message';
import Row from '../Form/Row';
import Col from '../Form/Col';
import Card from '../Form/Card';
import {Drawer} from 'antd';
import {listGutter} from '../../Styles/AppWrapper';
import Affix from '../Form/Affix';

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
  article: IArticle,
  company?: ICompany,
  showingOptions: boolean,
  previousImgUrl?: string,
}

const initialState: iState = {
  article: initialArticle,
  showingOptions: false,
  previousImgUrl: '',
};

const ArticleEditor = ({ article, onUpdated }: {article: IArticle, onUpdated?: Function}) => {
  const { company } = useSelector((s: RootState) => s.auth);
  const [state, setState] = useState(initialState);
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

  const handleValueChanged = (fieldName: string, newValue: string) => {
    const newArticle = {
      ...state.article,
      [fieldName]: newValue,
    };
    if (!newArticle.id) {
      message.error(intl.formatMessage({ id: 'invalid-content' }));
      return;
    }
    ArticleService.updateArticle(newArticle.id, newArticle)
      .then((res) => {
        const content = Object.assign(newArticle, res.data);
        setState({
          ...state,
          article: content,
        });
        message.success(intl.formatMessage({ id: 'content-update' }));
        if (typeof (onUpdated) === 'function') {
          onUpdated(newArticle);
        }
      })
      .catch((err) => {
        message.error(intl.formatMessage({ id: 'error-text' }, { text: err.message }));
      });
  };

  /**
   *
   */
  return (
    <ArticleEditorWrapper>
      <Row>
        <Col xs={{ span: 24 }}>
          <Card>
            <Row>
              <Col flex={'auto'}>
                <InlineInput
                  placeholder={intl.formatMessage({ id: 'title-article' })}
                  value={state.article.title}
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
                    visible={state.showingOptions}
                    closable={true}
                    onClose={() => setState({ ...state, showingOptions: false }) }
                  >
                    {!state.company ? null : (
                      <ArticleEditorSideOptions article={state.article} company={state.company} />
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
              value={state.article.description}
              placeholder={intl.formatMessage({ id: 'start-create' })}
            />
          </Card>
        </Col>
        <Col xs={{ span: 24 }} lg={{ span: 7 }} className={'options'}>
          <Card>
            {!state.company ? null : (
              <ArticleEditorSideOptions article={state.article} company={state.company} />
            )}
          </Card>
        </Col>
      </Row>
    </ArticleEditorWrapper>
  );
};

export default ArticleEditor;

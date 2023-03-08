import React, { useEffect, useState } from 'react';
import ReactHtmlParser from 'react-html-parser';
import styled from 'styled-components';
import { useIntl, FormattedMessage } from 'react-intl';
import IArticle, {initialArticle} from '../../Types/Article/IArticle';
import ICompany from '../../Types/Company/ICompany';
import ArticleEditorTags from './ArticleEditorTags';
import IAsset from '../../Types/Asset/IAsset';
import ArticleEditorAuthorSelector from './ArticleEditorAuthorSelector';
import ArticleService from '../../Services/ArticleService';
import InlineRichTextEditor from '../Form/InlineRichTextEditor';
import {
  BoxTitleDiv,
  BoxTitleSuffix,
  FormInputWrapper,
  inlineInputBgColor,
  inlineInputPaddingHalf
} from '../../Styles/AppWrapper';
import message from '../Form/message';
import SingleImageUploader from '../Form/SingleImageUploader';
import Space from '../Form/Space';
import Switch from '../Form/Switch';

const ContentFooterPreviewDiv = styled.div`
  overflow-y: auto;
  height: 200px;
  width: 100%;
  background: ${inlineInputBgColor};
  padding: ${inlineInputPaddingHalf};
`;

type iState = {
  article: IArticle,
  saving: boolean,
}
const initState: iState = {
  article: initialArticle,
  saving: false,
};
/**
 *
 */
const ArticleEditorSideOptions =  ({ article, company, onUpdated }: {article: IArticle, company: ICompany, onUpdated?: Function }) => {
  const [state, setState] = useState(initState);
  const intl = useIntl();

  useEffect(() => {
    setState((s) => ({
      ...s,
      article,
    }));
  }, [article]);

  /**
   *
   */
  const imgUploaded = (newAsset: IAsset | null) => {
    if (!state.article.id) return;
    setState({
      ...state,
      saving: true,
    });
    ArticleService.updateArticle(state.article.id, { ...state.article, images: newAsset === null ? [] : [newAsset] })
      .then((res) => {
        message.success(newAsset === null ? 'Cover image removed' : 'Cover image updated.');
        setState({
          ...state,
          saving: false,
        });
        if (typeof (onUpdated) === 'function') {
          onUpdated(res.data);
        }
      })
      .catch((err) => {
        message.error(`Error Occurred when updating cover image: ${err.message}, please delete and try again.`);
      });
  };

  const authorChanged = (newArticle: IArticle) => {
    setState({
      ...state,
      article: newArticle,
    });
    if (typeof (onUpdated) === 'function') {
      onUpdated(newArticle);
    }
  };

  const changeArticle = (fieldName: string, newValue: string | boolean | object) => {
    const newArticle = {
      ...state.article,
      [fieldName]: newValue,
    };
    if (!newArticle.id) return;
    setState({
      ...state,
      saving: true,
    });
    ArticleService.updateArticle(newArticle.id, newArticle)
      .then((res) => {
        setState({
          ...state,
          saving: false,
        });
        message.success('Content config updated.');
        setState({
          ...state,
          article: res.data,
        });
        if (typeof (onUpdated) === 'function') {
          onUpdated(res.data);
        }
      })
      .catch((err) => {
        message.error(`Error: ${err.message}`);
        setState({
          ...state,
          saving: false,
        });
      });
  };

  const changeConfigObj = (fieldName: string, newValue: string | boolean) => {
    changeArticle('configObj', {
      ...state.article.configObj,
      [fieldName]: newValue,
    });
  };

  return (
    <div className={'article-editor-side-options'}>
      <FormInputWrapper style={{ width: '100%', height: '192px', background: '#eee' }}>
        <SingleImageUploader
          onChange={imgUploaded}
          title={intl.formatMessage({ id: 'cover-image' })}
          initImgUrl={state.article.images.length > 0 ? state.article.images[0].url : undefined}
        />
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <FormattedMessage id="author" />
          <BoxTitleSuffix><FormattedMessage id="author-manage" /></BoxTitleSuffix>
        </BoxTitleDiv>
        <ArticleEditorAuthorSelector article={state.article} company={company} onChange={authorChanged}/>
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <FormattedMessage id="tags" />
        </BoxTitleDiv>
        <ArticleEditorTags article={state.article} company={company} />
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <FormattedMessage id="excerpt" />
          <BoxTitleSuffix>
            <FormattedMessage id="intro" />
          </BoxTitleSuffix>
        </BoxTitleDiv>
        <InlineRichTextEditor
          value={state.article.excerpt || ''}
          onChange={(newValue: string) => changeArticle('excerpt', newValue)}
        />
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <Space>
            <span><FormattedMessage id="display-footer" /></span>
            <Switch checkedChildren={intl.formatMessage({ id: 'yes' })} unCheckedChildren={intl.formatMessage({ id: 'no' })}
              checked={state.article.configObj?.ifShowCompanyContact === true}
              onChange={(checked: boolean) => changeConfigObj('ifShowCompanyContact', checked)}
              loading={state.saving}
            />
          </Space>
        </BoxTitleDiv>
        {state.article.configObj?.ifShowCompanyContact !== true ? null : (
          <ContentFooterPreviewDiv>
            { ReactHtmlParser(company.configObj?.defaultContact || '') }
          </ContentFooterPreviewDiv>
        )}
      </FormInputWrapper>
    </div>
  );
};

export default ArticleEditorSideOptions;

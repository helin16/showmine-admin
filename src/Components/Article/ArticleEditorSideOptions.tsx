import React, { useState } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import IArticle from '../../Types/Article/IArticle';
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
} from '../../Styles/AppWrapper';
import message from '../Form/message';
import SingleImageUploader from '../Form/SingleImageUploader';
import Space from '../Form/Space';
import Switch from '../Form/Switch';
import InputBox from '../Form/InputBox';

type iArticleEditorSideOptions = {
  article: IArticle,
  company: ICompany,
  onUpdate: (fieldName: string, newValue: any) => void,
  onUpdated?: (newArticle: IArticle) => void,
  onSetIsSaving?: (saving: boolean) => void;
}
/**
 *
 */
const ArticleEditorSideOptions =  ({ article, company, onUpdate, onUpdated, onSetIsSaving }: iArticleEditorSideOptions) => {
  const [isSaving, setIsSaving] = useState(false);
  const [newEditor, setNewEditor] = useState(article.configObj?.writer || '');
  const intl = useIntl();

  const imgUploaded = (newAsset: IAsset | null) => {
    if (!article.id) return;
    if (onSetIsSaving) {
      onSetIsSaving(true);
    } else {
      setIsSaving(true);
    }
    ArticleService.updateArticle(article.id, { ...article, images: newAsset === null ? [] : [newAsset] })
      .then((res) => {
        message.success(newAsset === null ? 'Cover image removed' : 'Cover image updated.');
        if (typeof (onUpdated) === 'function') {
          onUpdated(res.data);
        }
      })
      .catch((err) => {
        message.error(`Error Occurred when updating cover image: ${err.message}, please delete and try again.`);
      })
      .finally(() => {
        if (onSetIsSaving) {
          onSetIsSaving(false);
        } else {
          setIsSaving(false);
        }
      })
  };

  const updateEditor = () => {
    onUpdate('configObj', {
      ...article.configObj,
      writer: `${newEditor || ''}`.trim(),
    })
  }

  return (
    <div className={'article-editor-side-options'}>
      <FormInputWrapper style={{ width: '100%', height: '192px', background: '#eee' }}>
        <SingleImageUploader
          onChange={imgUploaded}
          title={intl.formatMessage({ id: 'cover-image' })}
          initImgUrl={article.images.length > 0 ? article.images[0].url : undefined}
        />
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <FormattedMessage id="author" />
          <BoxTitleSuffix><FormattedMessage id="author-manage" /></BoxTitleSuffix>
        </BoxTitleDiv>
        <ArticleEditorAuthorSelector article={article} onUpdated={onUpdated} onSetIsSaving={onSetIsSaving} />
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <FormattedMessage id="Editor" />
        </BoxTitleDiv>
        <InputBox
          value={newEditor}
          onChange={(e) => setNewEditor(e.target.value)}
          onBlur={() => updateEditor()}
          onPressEnter={() => updateEditor()}
        />
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <FormattedMessage id="tags" />
        </BoxTitleDiv>
        <ArticleEditorTags article={article} company={company} onUpdate={onUpdate} />
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <FormattedMessage id="excerpt" />
          <BoxTitleSuffix>
            <FormattedMessage id="intro" />
          </BoxTitleSuffix>
        </BoxTitleDiv>
        <InlineRichTextEditor
          value={article.excerpt || ''}
          onChange={(newValue: string) => onUpdate('excerpt', newValue)}
        />
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <Space>
            <span><FormattedMessage id="display-footer" /></span>
            <Switch checkedChildren={intl.formatMessage({ id: 'yes' })} unCheckedChildren={intl.formatMessage({ id: 'no' })}
              checked={article.configObj?.ifShowCompanyContact === true}
              onChange={(checked: boolean) => onUpdate('configObj', {
                ...article.configObj,
                ifShowCompanyContact: checked === true ? true : false,
              })}
              loading={isSaving}
            />
          </Space>
        </BoxTitleDiv>
        {article.configObj?.ifShowCompanyContact !== true ? null : (
          <InlineRichTextEditor
            value={company.configObj?.defaultContact || ''}
            onChange={(newValue: string) => onUpdate('configObj', {
              ...article.configObj,
              defaultContact: newValue,
            })}
          />
        )}
      </FormInputWrapper>
    </div>
  );
};

export default ArticleEditorSideOptions;

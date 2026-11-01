import React, { useState } from 'react'
import { useIntl, FormattedMessage } from 'react-intl'
import IArticle from '../../Types/Article/IArticle'
import ArticleEditorTags from './ArticleEditorTags'
import IAsset, {ASSET_TYPE_ITEM_COVER, ASSET_TYPE_ITEM_DESCRIPTION} from '../../Types/Asset/IAsset'
import ArticleEditorAuthorSelector from './ArticleEditorAuthorSelector'
import ArticleService from '../../Services/ArticleService'
import InlineRichTextEditor from '../Form/InlineRichTextEditor'
import { BoxTitleDiv, BoxTitleSuffix, FormInputWrapper } from '../../Styles/AppWrapper'
import message from '../Form/message'
import SingleImageUploader from '../Form/SingleImageUploader'
import Spin from '../Form/Spin';
import Switch from '../Form/Switch';

type iArticleEditorSideOptions = {
  article: IArticle
  onUpdate: (fieldName: string, newValue: string | boolean | number) => void
  onUpdated?: (newArticle: IArticle) => void
  onSetIsSaving?: (saving: boolean) => void
}
/**
 *
 */
const ArticleEditorSideOptions = ({
  article,
  onUpdate,
  onUpdated,
  onSetIsSaving,
}: iArticleEditorSideOptions) => {
  const [isSaving, setIsSaving] = useState(false);
  const intl = useIntl();

  const imgUploaded = (newAsset: IAsset | null) => {
    if (!article.id) return;
    if (onSetIsSaving) {
      onSetIsSaving(true);
    } else {
      setIsSaving(true);
    }
    ArticleService.update(article.id, {
        coverAssetId: newAsset === null ? null : newAsset.id
      })
      .then((res) => {
        message.success(newAsset === null ? 'Cover image removed' : 'Cover image updated.');
        if (typeof (onUpdated) === 'function') {
          onUpdated(res);
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

  return (
    <Spin spinning={isSaving} className={'article-editor-side-options'}>
      <FormInputWrapper style={{ width: '100%', height: '192px', background: '#eee' }}>
        <SingleImageUploader
          assetType={ASSET_TYPE_ITEM_COVER}
          onChange={imgUploaded}
          title={intl.formatMessage({ id: 'cover-image' })}
          initImgUrl={`${article.CoverAsset?.url || ''}`.trim()}
          onSetIsSaving={onSetIsSaving}
        />
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <FormattedMessage id="author" />
          <BoxTitleSuffix><FormattedMessage id="author-manage" /></BoxTitleSuffix>
        </BoxTitleDiv>
        <ArticleEditorAuthorSelector article={article} onUpdate={onUpdate} showCreate={false} />
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <FormattedMessage id="tags" />
        </BoxTitleDiv>
        <ArticleEditorTags article={article} />
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <FormattedMessage id="gTranslateFlag" />
          <BoxTitleSuffix><FormattedMessage id="gTranslateFlagMsg" /></BoxTitleSuffix>
        </BoxTitleDiv>
        <Switch
          aria-label={intl.formatMessage({ id: 'gTranslateFlag' })}
          checked={article.enableGTranslateFlag}
          onClick={(checked) => onUpdate('enableGTranslateFlag', checked)}
        />{' '}<FormattedMessage id="gTranslateFlag" />
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <FormattedMessage id="commentsFlag" />
          <BoxTitleSuffix><FormattedMessage id="commentsFlagMsg" /></BoxTitleSuffix>
        </BoxTitleDiv>
        <Switch
          aria-label={intl.formatMessage({ id: 'commentsFlag' })}
          checked={article.enableCommentsFlag === true}
          onClick={(checked) => onUpdate('enableCommentsFlag', checked)}
        />{' '}<FormattedMessage id="commentsFlag" />
      </FormInputWrapper>

      <FormInputWrapper>
        <BoxTitleDiv>
          <FormattedMessage id="excerpt" />
          <BoxTitleSuffix>
            <FormattedMessage id="intro" />
          </BoxTitleSuffix>
        </BoxTitleDiv>
        <InlineRichTextEditor
          assetType={ASSET_TYPE_ITEM_DESCRIPTION}
          value={article.excerpt || ''}
          isInLine={true}
          showToolBar={false}
          onChange={(newValue: string) => onUpdate('excerpt', newValue)}
        />
      </FormInputWrapper>
    </Spin>
  );
}

export default ArticleEditorSideOptions

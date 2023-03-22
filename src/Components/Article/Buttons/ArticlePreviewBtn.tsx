import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import IArticle from '../../../Types/Article/IArticle'
import ArticleService from '../../../Services/ArticleService'
import Button, { iButton } from '../../Form/Button'
import Modal from '../../Form/Modal'
import Typography from '../../Form/Typography'
import Icons from '../../Icons'
import SkeletonImage from '../../Form/SkeletonImage'
import Alert from '../../Form/Alert';
import {QRCodeSVG} from 'qrcode.react';

const ArticlePreviewBtn = ({ article, children, ...props }: iButton & { article?: IArticle }) => {
  const [showingDiv, setShowingDiv] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const intl = useIntl();

  useEffect(() => {
    const articleId = `${article?.id || ''}`.trim();
    if (articleId === '') {
      return;
    }
    setPreviewUrl(ArticleService.getPreviewUrl(articleId))
  }, [article]);


  const getPopupContent = () => {
    if (article?.isPublished !== true) {
      return (
        <Alert message={'This article is NOT published yet. Please publish it first.'} type={'error'} />
      );
    }
    return (
      <>
        <Typography.Paragraph>
          {intl.formatMessage({ id: 'preview_content_web' })}
          <p>
            <Button
              href={previewUrl}
              type={'link'} icon={<Icons.EyeOutlined />} target={'__blank'}>
              {intl.formatMessage({ id: 'view_on_web' })}
            </Button>
          </p>
        </Typography.Paragraph>

        <Typography.Paragraph>
          {intl.formatMessage({ id: 'view_on_mobile' })}
          {`${previewUrl || ''}`.trim() === '' ? (
            <SkeletonImage />
          ) : (
            <div><QRCodeSVG value={previewUrl} /></div>
          )}
        </Typography.Paragraph>
      </>
    )
  }

  const getPopup = () => {
    if (showingDiv !== true) {
      return null;
    }

    return (
      <Modal
        open={showingDiv === true}
        title={intl.formatMessage({ id: 'preview_content' })}
        onCancel={() => { setShowingDiv(false); }}
        footer={null}
      >
        {getPopupContent()}
      </Modal>
    );
}

  if (!article) {
    return null;
  }

  return (
    <>
      <Button {...props} onClick={() => { setShowingDiv(true); }}>
        {children || intl.formatMessage({ id: 'preview' })}
      </Button>
      {getPopup()}
    </>
  );
}

export default ArticlePreviewBtn

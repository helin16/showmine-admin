import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import IArticle from '../../../Types/Article/IArticle'
import ArticleService from '../../../Services/ArticleService'
import Button, { iButton } from '../../Form/Button'
import Modal from '../../Form/Modal'
import message from '../../Form/message'
import Typography from '../../Form/Typography'
import Spin from '../../Form/Spin'
import Image from '../../Form/Image'
import Icons from '../../Icons'
import SkeletonImage from '../../Form/SkeletonImage'
import Alert from '../../Form/Alert';

type iState = {
  showingDiv: boolean
  previewQrCodeImgUrl: string
  previewUrl: string
  loading: boolean
}
const initialState: iState = {
  showingDiv: false,
  previewQrCodeImgUrl: '',
  previewUrl: '',
  loading: true,
}

const ArticlePreviewBtn = ({ article, children, ...props }: iButton & { article?: IArticle }) => {
  // const [state, setState] = useState(initialState);
  const [showingDiv, setShowingDiv] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewQrCodeImgUrl, setPreviewQrCodeImgUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const intl = useIntl();
  //
  // useEffect(() => {
  //   if (!article || !article.id) return;
  //   setState((s) => ({
  //     ...s,
  //     article,
  //     previewUrl: `${process.env.REACT_APP_FRONT_END_URL}/item/${article.slug}`,
  //     showingDiv: false,
  //   }));
  //   let isCanceled = false;
  //   ArticleService.getArticleQrCode(article.id)
  //     .then((res) => {
  //       if (isCanceled === true) return;
  //       setState((s) => ({
  //         ...s,
  //         previewQrCodeImgUrl: res.data.showMine,
  //         loading: false,
  //       }));
  //     })
  //     .catch((err) => {
  //       if (isCanceled === true) return;
  //       message.error(`Error when fetching QrCode ${err.message}`);
  //       setState((s) => ({
  //         ...s,
  //         loading: false,
  //       }));
  //     });
  //   return () => { // eslint-disable-line
  //     isCanceled = true;
  //   };
  // }, [article]);
  //
  // const showOrHideDiv = (showing: boolean) => {
  //   setState({
  //     ...state,
  //     showingDiv: showing,
  //   });
  // };


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
              href={ArticleService.getPreviewUrl(article?.id || '')}
              type={'link'} icon={<Icons.EyeOutlined />} target={'__blank'}>
              {intl.formatMessage({ id: 'view_on_web' })}
            </Button>
          </p>
        </Typography.Paragraph>

        <Typography.Paragraph>
          {intl.formatMessage({ id: 'view_on_mobile' })}
          <Spin spinning={loading === true}>
            {`${previewQrCodeImgUrl || ''}`.trim() === '' ? (
              <SkeletonImage />
            ) : (
              <Image src={previewQrCodeImgUrl} />
            )}
          </Spin>
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

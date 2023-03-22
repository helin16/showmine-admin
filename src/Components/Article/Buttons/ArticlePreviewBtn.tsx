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
  return null
  // const [state, setState] = useState(initialState);
  // const intl = useIntl();
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
  //
  // if (!state.article) {
  //   return null;
  // }
  //
  // return (
  //   <>
  //     <Button {...props} onClick={() => { showOrHideDiv(true); }}>
  //       {children || intl.formatMessage({ id: 'preview' })}
  //     </Button>
  //     {state.showingDiv !== true ? null : (
  //       <Modal
  //         open={state.showingDiv === true}
  //         title={intl.formatMessage({ id: 'preview_content' })}
  //         onCancel={() => { showOrHideDiv(false); }}
  //         footer={null}
  //       >
  //         <Typography.Paragraph>
  //           {intl.formatMessage({ id: 'preview_content_web' })}
  //           <p>
  //             <Button href={state.previewUrl}
  //               type={'link'} icon={<Icons.EyeOutlined />} target={'__blank'}>
  //               {intl.formatMessage({ id: 'view_on_web' })}
  //             </Button>
  //           </p>
  //         </Typography.Paragraph>
  //
  //         <Typography.Paragraph>
  //           {intl.formatMessage({ id: 'view_on_mobile' })}
  //           <Spin spinning={state.loading === true}>
  //             {state.loading === true ? (
  //               <SkeletonImage />
  //             ) : (
  //               <Image src={state.previewQrCodeImgUrl} />
  //             )}
  //           </Spin>
  //         </Typography.Paragraph>
  //
  //       </Modal>
  //     )}
  //   </>
  // );
}

export default ArticlePreviewBtn

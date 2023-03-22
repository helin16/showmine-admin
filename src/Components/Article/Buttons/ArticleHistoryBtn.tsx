import React from 'react'
import IArticle from '../../../Types/Article/IArticle'
import {iButton} from '../../Form/Button';

// const TimelineWrapper = styled.div`
//   .item-title {
//     margin-bottom: 0px;
//   }
//   .item-content {
//     font-style: italic;
//     margin-bottom: 0px;
//   }
// `;

// type iState = {
//   article?: IArticle,
//   company?: ICompany,
//   showingDiv: boolean,
//   loading: boolean,
//   loadingMore: boolean,
//   loadingErr?: IError,
//   historicalItems: IResList<IArticleHistoryItem>,
//   pageNo: number,
// }
// const initialState: iState = {
//   pageNo: 1,
//   article: initialArticle,
//   company: undefined,
//   showingDiv: false,
//   loading: true,
//   loadingMore: false,
//   historicalItems: InitialList,
// };
type iArticleHistoryBtn = iButton & { article?: IArticle }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ArticleHistoryBtn = ({ article, children, ...props }: iArticleHistoryBtn) => {
  return <div />
  // const [state, setState] = useState(initialState);
  // const { company } = useSelector((s: RootState) => s.auth);
  // const intl = useIntl();
  //
  // useEffect(() => {
  //   if (!article) return;
  //   const comp = (article.company || company);
  //   setState((s) => ({
  //     ...s,
  //     article,
  //     company: comp === null ? undefined : comp,
  //     showingDiv: false,
  //   }));
  // }, [article, company]);
  //
  // useEffect(() => {
  //   if (state.showingDiv !== true || !state.article || !state.article.id) return;
  //
  //   setState((s) => ({
  //     ...s,
  //     loading: state.pageNo === 1,
  //     loadingMore: state.pageNo > 1,
  //     loadingErr: undefined,
  //   }));
  //   let isCancelled = false;
  //   ArticleService.getEditingHistory(state.article.id, { page: state.pageNo })
  //     .then((res) => {
  //       if (isCancelled === true) return;
  //       setState((s) => ({
  //         ...s,
  //         loading: false,
  //         loadingMore: false,
  //         historicalItems: Utils.concatIRestList(s.historicalItems, res.data),
  //       }));
  //     })
  //     .catch((err) => {
  //       if (isCancelled === true) return;
  //       setState((s) => ({
  //         ...s,
  //         loading: false,
  //         loadingMore: false,
  //         loadingErr: err,
  //       }));
  //     });
  //   return () => { // eslint-disable-line
  //     isCancelled = true;
  //   };
  // }, [state.showingDiv, state.article, state.pageNo]);
  //
  // const showOrHideConfirmDiv = (showing: boolean) => {
  //   setState({
  //     ...state,
  //     showingDiv: showing,
  //   });
  // };
  //
  // const showMore = () => {
  //   setState({
  //     ...state,
  //     pageNo: state.pageNo + 1,
  //   });
  // };
  //
  // const getHistoryPanel = () => (
  //     <TimelineWrapper>
  //       <Timeline items={
  //         state.historicalItems.data.map((item: IArticleHistoryItem, index: number) => (
  //           {
  //             key: index,
  //             color: index > 0 ? 'grey' : 'blue',
  //             children: (
  //               <div className={'timeline-item'}>
  //                 <div>
  //                   <b>{moment(item.created_at).format('lll')} <small>[{moment(item.created_at).fromNow()}]</small></b>
  //                 </div>
  //                 <Typography.Paragraph ellipsis className={'item-title'}>
  //                   {item.contentObj?.title}
  //                 </Typography.Paragraph>
  //                 <Typography.Paragraph ellipsis className={'item-content'}>
  //                   {Utils.stripHTMLTags(item.contentObj?.description || '')}
  //                 </Typography.Paragraph>
  //               </div>
  //             )
  //           }
  //         ))
  //       }/>
  //       {state.historicalItems.current_page >= state.historicalItems.last_page ? null : (
  //         <Button type={'primary'} icon={<Icons.ArrowDownOutlined />} loading={state.loadingMore} onClick={showMore}>
  //           Show More
  //         </Button>
  //       )}
  //     </TimelineWrapper>
  // );
  //
  // if (!state.article) {
  //   return null;
  // }
  //
  // return (
  //   <>
  //     <Button {...props} onClick={() => { showOrHideConfirmDiv(true); }}>
  //       {children || intl.formatMessage({ id: 'edit_history' })}
  //     </Button>
  //     {state.showingDiv !== true ? null : (
  //       <Modal
  //         open={state.showingDiv === true}
  //         title={`${intl.formatMessage({ id: 'edit_history' })}:`}
  //         footer={null}
  //         width={'80%'}
  //         onCancel={() => { showOrHideConfirmDiv(false); }}
  //       >
  //         <Spin spinning={state.loading}>
  //           {getHistoryPanel()}
  //         </Spin>
  //       </Modal>
  //     )}
  //   </>
  // );
}

export default ArticleHistoryBtn

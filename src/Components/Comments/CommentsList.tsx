import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import moment from 'moment'
import styled from 'styled-components'
import CommentService from '../../Services/CommentService'
import { ARTICLE_DETAILS_URL, getUrl } from '../../UrlMap'
import Utils from '../../Services/Utils'
import translate from '../../i18n/translate'
import IComment from '../../Types/Comments/IComment'
import IResList from '../../Types/IResList'
import message from '../Form/message'
import LoadMoreBtn from '../Form/LoadMoreBtn'
import List, { ListItem } from '../Form/List'
import Tooltip from '../Form/Tooltip'
import UserAvatar from '../User/UserAvatar'
import Button from '../Form/Button'
import Icons from '../Icons'
import Comment from '../Form/Comment'
import PopConfirm from '../Form/Popconfirm'
import Modal from '../Form/Modal'
import Collapse, { Panel } from '../Form/Collapse'
import RichTextEditor from '../Form/RichTextEditor'
import MathHelper from '../../Helpers/MathHelper';
import IArticle from '../../Types/Article/IArticle';

// const { Panel } = Collapse;

type iCommentListItem = IComment & {
  loading?: boolean
}

const CommentDiv = styled.div``
const CommentArticleDiv = styled.div``
const ReplyToDiv = styled.div`
  color: rgba(0, 0, 0, 0.45);
`

type iState = {
  initLoading: boolean
  loadingMore: boolean
  commentsList?: IResList<IComment>
  pageNo: number
  newReplyContent: string
  replyItemId: string | undefined
  replyId: string | undefined
  commentIndex: number
  isSaving: boolean
}
const initState: iState = {
  initLoading: false,
  loadingMore: false,
  pageNo: 1,
  newReplyContent: '',
  replyItemId: '',
  replyId: '',
  commentIndex: 0,
  isSaving: false,
}

const CommentsList = ({ itemId }: { itemId?: string }) => {
  const currentItemId = `${itemId || ''}`.trim();
  const [state, setState] = useState(initState);
  /**
   * getting all comments for an company
   */
  useEffect(() => {
    setState((s) => ({
      ...s,
      initLoading: state.pageNo === 1,
      loadingMore: state.pageNo > 1,
    }));
    let isCancelled = false;
    CommentService.getAll({
        where: JSON.stringify({
          isActive: true,
          entityName: 'Item',
          ...(`${itemId || ''}`.trim() === '' ? {}: { entityId: itemId, entityName: 'Item' })
        }),
        currentPage: state.pageNo
      })
      .then((res) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          commentsList: s.commentsList ? Utils.concatIRestList(s.commentsList, res) : res,
          initLoading: false,
          loadingMore: false,
          newReplyContent: '',
          replyItemId: '',
          replyId: '',
          commentIndex: 0,
        }));
      })
      .catch((err) => {
        if (isCancelled === true) return;
        message.error(`Error when fetching comments: ${err.message}`);
      })
      .finally(() => {
        setState((s) => ({
          ...s,
          initLoading: false,
          loadingMore: false,
          newReplyContent: '',
          replyItemId: '',
          replyId: '',
          commentIndex: 0,
        }));
      });
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [currentItemId, state.pageNo]);
  /**
   *
   */
  const delComment = (comment: IComment, index: number, replyIndex?: number) => {
    const commentId = `${comment.id || ''}`.trim();
    if (commentId === '') {
      return;
    }

    setState({
      ...state,
      isSaving: true,
    })
    CommentService.deactivate(commentId)
      .then(() => {
        if (replyIndex === 0 || !!replyIndex) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          (state.commentsList?.data || [])[index].replys.splice(replyIndex, 1);
        } else {
          (state.commentsList?.data || []).splice(index, 1);
          setState({
            ...state,
            commentsList: state.commentsList,
          });
        }
        message.success('Comment deleted.');
      })
      .catch((err) => {
        message.error(`Failed to delete comments: ${Utils.getErrorMessage(err)}`);
      })
      .finally(() => {
        setState({
          ...state,
          isSaving: false,
        })
      });
  };
  const showModal = (replyID: string|undefined, replyItemID: string, idx: number) => {
    setState({
      ...state,
      replyId: replyID,
      replyItemId: replyItemID,
      newReplyContent: '',
      commentIndex: idx,
    })
  };

  // const handleOk = () => {
  //   const commentIndex = state.commentIndex || 0;
  //   setState({
  //     ...state,
  //     isSaving: true,
  //   })
  //   CommentService.create({
  //       content:
  //     })
  //     .then((res) => {
  //       // @ts-ignore
  //       (state.commentsList?.data || [])[commentIndex].replys.unshift(res);
  //     })
  //     .catch((err) => {
  //       message.error(`Failed to delete comments: ${err.data.message}`);
  //     })
  //     .finally(() => {
  //       setState({
  //         ...state,
  //         isSaving: false,
  //       })
  //     })
  //   ;
  // };
  //
  // const handleCancel = () => {
  //   setState({
  //     ...state,
  //     replyId: undefined,
  //     replyItemId: undefined,
  //     newReplyContent: '',
  //     commentIndex: 0,
  //   })
  // };

  const onTextChange = (newValue: string) => {
    setState({
      ...state,
      newReplyContent: newValue,
    })
  };

  const getSubComments = (comment: IComment, index: number) => {
    const replys: IComment[] = [];
    if (replys.length <= 0) {
      return null;
    }
    return (
      <Collapse defaultActiveKey={[]} ghost>
        <Panel header={translate('len-comments', { num: replys.length })} key="1">
          {
            replys.map((reply: IComment, replyIndex) => (
              <Comment
                key={reply.id}
                author={reply.CreatedBy ? reply.CreatedBy.nickName : '*'}
                avatar={<UserAvatar user={reply.CreatedBy}/>}
                actions={[
                  <Button type="link" id={reply.id} onClick={() => showModal(reply.id, reply.entityId, index)} key={'link'}>
                    <Icons.CommentOutlined />
                    {translate('reply')}
                  </Button>,
                  <PopConfirm
                    title={translate('delete-confirm')}
                    onConfirm={() => {
                      delComment(reply, index, replyIndex);
                    }}
                    okText={translate('yes')}
                    cancelText={translate('no')}
                    key={'delete'}
                  >
                    <Button danger type="text">
                      <Icons.DeleteOutlined />
                      {translate('delete')}
                    </Button>
                  </PopConfirm>,
                ]}
                content={
                  <CommentDiv>
                    <ReplyToDiv>To: {reply.ReplyTo?.CreatedBy?.nickName || '*'}</ReplyToDiv>
                    <div dangerouslySetInnerHTML={{ __html: reply.comments }}></div>
                  </CommentDiv>
                }
                datetime={<span>{moment(comment.createdAt).format('lll')}</span>}
              />
            ))
          }
        </Panel>
      </Collapse>
    )
  }

  const getCommentsList = () => {
    return (
      <List
        className="comments-list"
        loading={state.initLoading}
        loadMore={
          <LoadMoreBtn
            showing={(state.commentsList?.currentPage || 0) < (state.commentsList?.pages || 0)}
            loading={state.loadingMore}
            onClick={() => setState({ ...state, pageNo: MathHelper.add(state.commentsList?.currentPage || 0, 1) })}
          />
        }
        itemLayout={'horizontal'}
        dataSource={state.commentsList?.data || []}
        renderItem={(comment: IComment, index: number) => {
          return (
            <ListItem key={comment.id}>
              <Comment
                author={comment.CreatedBy?.nickName || ''}
                avatar={<UserAvatar user={comment.CreatedBy}/>}
                actions={
                  <>
                    <Button size={'small'} type="link" id={comment.id} onClick={() => showModal(comment.id, comment.entityId, index)}>
                      <Icons.CommentOutlined />
                      {translate('reply')}
                    </Button>
                    <PopConfirm
                      title={translate('delete-confirm')}
                      onConfirm={() => {
                        delComment(comment, index);
                      }}
                      okText={translate('yes')}
                      cancelText={translate('no')}
                    >
                      <Button danger type="text" size={'small'} >
                        <Icons.DeleteOutlined />
                        {translate('delete')}
                      </Button>
                    </PopConfirm>
                  </>
                }
                content={
                  <CommentDiv>
                    <CommentArticleDiv>
                      <Tooltip title={'comments'}>
                        <Link to={getUrl(ARTICLE_DETAILS_URL, ':id', comment.entityId)}>
                          {'Article'}
                        </Link>
                      </Tooltip>
                    </CommentArticleDiv>
                    {comment.comments}
                  </CommentDiv>
                }
                datetime={<span>{moment(comment.createdAt).format('lll')}</span>}
              >
                {getSubComments(comment, index)}
              </Comment>
            </ListItem>
          );
        }}
      />
    )
  }

  const getReplyPopup = () => {
    return (
      <Modal
        title={'Reply to Comments'}
        open={`${state.replyId || ''}`.trim() !== ''}
        // onOk={handleOk}
        // onCancel={handleCancel}
        width={'80%'}
      >
        <RichTextEditor
          value={state.newReplyContent}
          onChange={(newValue: string) => onTextChange(newValue)}
          placeholder={'Start to reply...'}
        />
      </Modal>
    )
  }
  /**
   *
   */
  return (
    <>
      {getCommentsList()}
      {getReplyPopup()}
    </>
  );
}

export default CommentsList

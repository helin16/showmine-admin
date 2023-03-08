import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import styled from 'styled-components';
import CommentsService from '../../Services/CommentsService';
import { ARTICLE_DETAILS_URL, getUrl } from '../../UrlMap';
import Utils from '../../Services/Utils';
import translate from '../../i18n/translate';
import IComment from '../../Types/Comments/IComment';
import IResList from '../../Types/IResList';
import message from '../Form/message';
import LoadMoreBtn from '../Form/LoadMoreBtn';
import List, {ListItem} from '../Form/List';
import Tooltip from '../Form/Tooltip';
import UserAvatar from '../User/UserAvatar';
import Button from '../Form/Button';
import Icons from '../Icons';
import Comment from '../Form/Comment';
import PopConfirm from '../Form/Popconfirm';
import Modal from '../Form/Modal';
import Collapse, {Panel} from '../Form/Collapse';
import RichTextEditor from '../Form/RichTextEditor';

// const { Panel } = Collapse;

interface iItem extends IComment {
  loading?: boolean
}

const CommentDiv = styled.div``;
const CommentArticleDiv = styled.div``;
const ReplyToDiv = styled.div`color: rgba(0, 0, 0, 0.45);`;

const commentsList: IResList<IComment> = {
  from: 0,
  to: 0,
  per_page: 0, // eslint-disable-line
  total: 0,
  current_page: 0, // eslint-disable-line
  last_page: 0, // eslint-disable-line
  data: [],
};

type iState = {
  initLoading: boolean;
  loadingMore: boolean;
  commentsList: IResList<IComment>,
  pageNo: number;
  newReplyContent: string;
  replyItemId: string | undefined;
  replyId: string | undefined;
  commentIndex: number;
  isSaving: boolean;
}
const initState: iState = {
  initLoading: false,
  loadingMore: false,
  commentsList,
  pageNo: 1,
  newReplyContent: '',
  replyItemId: '',
  replyId: '',
  commentIndex: 0,
  isSaving: false,
};

const CommentsList = ({ companyId, itemId }: {companyId?: string, itemId?: string}) => {
  const [state, setState] = useState(initState);
  /**
   * getting all comments for an company
   */
  useEffect(() => {
    if (companyId === undefined) {
      return;
    }
    setState((s) => ({
      ...s,
      initLoading: state.pageNo === 1,
      loadingMore: state.pageNo > 1,
    }));
    let isCancelled = false;
    CommentsService.getAllCommentsUnderACompany(companyId, { page: state.pageNo })
      .then((res) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          commentsList: Utils.concatIRestList(s.commentsList, res.data),
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
  }, [companyId, state.pageNo]);
  /**
   * getting all comments for an item
   */
  useEffect(() => {
    if (itemId === undefined) {
      return;
    }
    setState((s) => ({
      ...s,
      initLoading: state.pageNo === 1,
      loadingMore: state.pageNo > 1,
    }));
    let isCancelled = false;
    CommentsService.getAllCommentsForAnItem(itemId, { page: state.pageNo })
      .then((res) => {
        if (isCancelled === true) return;
        setState((s) => ({
          ...s,
          commentsList: Utils.concatIRestList(s.commentsList, res.data),
          initLoading: false,
          loadingMore: false,
        }));
      })
      .catch((err) => {
        message.error(`Error when fetching comments: ${err.message}`);
        setState((s) => ({
          ...s,
          initLoading: false,
          loadingMore: false,
        }));
      });
    return () => { // eslint-disable-line
      isCancelled = true;
    };
  }, [itemId, state.pageNo]);
  /**
   *
   */
  const delComment = (comment: IComment, index: number, replyIndex?: number) => {
    if (!comment.id || !comment.item_id) return;
    setState({
      ...state,
      isSaving: true,
    })
    CommentsService.deleteComment(comment.id, comment.item_id)
      .then(() => {
        if (replyIndex === 0 || !!replyIndex) {
          state.commentsList.data[index].replys.splice(replyIndex, 1);
        } else {
          state.commentsList.data.splice(index, 1);
          setState({
            ...state,
            commentsList: state.commentsList,
          });
        }
        message.success(`Comment deleted.`);
      })
      .catch((err) => {
        message.error(`Failed to delete comments: ${err.data.message}`);
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

  const handleOk = () => {
    const commentIndex = state.commentIndex || 0;
    setState({
      ...state,
      isSaving: true,
    })
    CommentsService.createComment(state.newReplyContent, state.replyItemId || '', state.replyId || '')
      .then((res) => {
        state.commentsList.data[commentIndex].replys.unshift(res.data);
      })
      .catch((err) => {
        message.error(`Failed to delete comments: ${err.data.message}`);
      })
      .finally(() => {
        setState({
          ...state,
          isSaving: false,
        })
      })
    ;
  };

  const handleCancel = () => {
    setState({
      ...state,
      replyId: undefined,
      replyItemId: undefined,
      newReplyContent: '',
      commentIndex: 0,
    })
  };

  const onTextChange = (newValue: string) => {
    setState({
      ...state,
      newReplyContent: newValue,
    })
  };

  const getSubComments = (comment: IComment, index: number) => {
    if (comment.replys.length <= 0) {
      return null;
    }
    return (
      <Collapse defaultActiveKey={[]} ghost>
        <Panel header={translate('len-comments', { num: comment.replys.length })} key="1">
          {
            comment.replys.map((reply, replyIndex) => (
              <Comment
                key={reply.id}
                author={reply.created_by ? reply.created_by.nick_name : '*'}
                avatar={<UserAvatar user={reply.created_by}/>}
                actions={[
                  <Button type="link" id={reply.id} onClick={() => showModal(reply.id, reply.item_id, index)}>
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
                  >
                    <Button danger type="text">
                      <Icons.DeleteOutlined />
                      {translate('delete')}
                    </Button>
                  </PopConfirm>,
                ]}
                content={
                  <CommentDiv>
                    <ReplyToDiv>To: {reply.reply_to ? reply.reply_to.nick_name : '*'}</ReplyToDiv>
                    <div dangerouslySetInnerHTML={{ __html: reply.comments }}></div>
                  </CommentDiv>
                }
                datetime={<span>{moment(comment.created_at).format('lll')}</span>}
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
            showing={state.commentsList.current_page < state.commentsList.last_page}
            loading={state.loadingMore}
            onClick={() => setState({ ...state, pageNo: state.commentsList.current_page + 1 })}
          />
        }
        itemLayout={'horizontal'}
        dataSource={state.commentsList.data}
        renderItem={(comment: iItem, index: number) => {
          if (comment.active !== 1) {
            return null;
          }
          return (
            <ListItem key={comment.id}>
              <Comment
                author={comment.created_by.nick_name}
                avatar={<UserAvatar user={comment.created_by}/>}
                actions={
                  <>
                    <Button size={'small'} type="link" id={comment.id} onClick={() => showModal(comment.id, comment.item_id, index)}>
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
                      <Tooltip title={comment.item?.title}>
                        <Link to={getUrl(ARTICLE_DETAILS_URL, ':id', comment.item_id)}>
                          {comment.item?.title}
                        </Link>
                      </Tooltip>
                    </CommentArticleDiv>
                    {comment.comments}
                  </CommentDiv>
                }
                datetime={<span>{moment(comment.created_at).format('lll')}</span>}
              >
                {
                  getSubComments(comment, index)
                }
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
        title={`Reply to Comments`}
        open={`${state.replyId || ''}`.trim() !== ''}
        onOk={handleOk}
        onCancel={handleCancel}
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
};

export default CommentsList;

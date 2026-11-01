import React, { useEffect, useState } from 'react'
import { Input } from 'antd'
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
import Modal from '../Form/Modal'
import Tag from '../Form/Tag'
import MathHelper from '../../Helpers/MathHelper'

const MAX_REPLY_LENGTH = 1000

const CommentDiv = styled.div`
  white-space: pre-wrap;
`
const CommentArticleDiv = styled.div``

type iState = {
  initLoading: boolean
  loadingMore: boolean
  commentsList?: IResList<IComment>
  pageNo: number
  replyTo?: IComment
  replyText: string
  isSaving: boolean
}
const initState: iState = {
  initLoading: false,
  loadingMore: false,
  pageNo: 1,
  replyText: '',
  isSaving: false,
}

const getReplies = (comment: IComment) =>
  (comment.Replys || [])
    .filter((reply) => reply.isActive !== false)
    .sort((a, b) => moment(a.createdAt).diff(moment(b.createdAt)))

const CommentsListContent = ({ itemId }: { itemId?: string }) => {
  const currentItemId = `${itemId || ''}`.trim()
  const [state, setState] = useState(initState)

  useEffect(() => {
    setState((s) => ({
      ...s,
      initLoading: state.pageNo === 1,
      loadingMore: state.pageNo > 1,
    }))
    let isCancelled = false
    CommentService.getAll({
      where: JSON.stringify({
        isActive: true,
        entityName: 'Item',
        replyToId: null,
        ...(currentItemId === '' ? {} : { entityId: currentItemId }),
      }),
      include: 'CreatedBy,Replys.CreatedBy',
      sort: 'createdAt:DESC',
      currentPage: state.pageNo,
    })
      .then((res) => {
        if (isCancelled === true) return
        setState((s) => ({
          ...s,
          commentsList: s.commentsList ? Utils.concatIRestList(s.commentsList, res) : res,
        }))
      })
      .catch((err) => {
        if (isCancelled === true) return
        message.error(`Error when fetching comments: ${err.message}`)
      })
      .finally(() => {
        setState((s) => ({ ...s, initLoading: false, loadingMore: false }))
      })
    return () => { // eslint-disable-line
      isCancelled = true
    }
  }, [currentItemId, state.pageNo])

  // Replies sit inside their comment, so one change can be at either level.
  const updateRow = (id: string | undefined, change: (row: IComment) => IComment) => {
    setState((s) => {
      if (!s.commentsList) return s
      const data = s.commentsList.data.map((row) => {
        if (row.id === id) return change(row)
        return { ...row, Replys: row.Replys?.map((reply) => (reply.id === id ? change(reply) : reply)) }
      })
      return { ...s, commentsList: { ...s.commentsList, data } }
    })
  }

  const toggleHidden = (comment: IComment) => {
    const isHidden = comment.isHidden !== true
    CommentService.hide(`${comment.id}`, isHidden)
      .then(() => updateRow(comment.id, (row) => ({ ...row, isHidden })))
      .catch((err) => {
        message.error(translate('comment-hide-failed', { message: Utils.getErrorMessage(err) }))
      })
  }

  const closeReply = () => setState((s) => ({ ...s, replyTo: undefined, replyText: '' }))

  const sendReply = () => {
    const text = state.replyText.trim()
    const { replyTo } = state
    if (!replyTo || text === '') return
    setState((s) => ({ ...s, isSaving: true }))
    CommentService.reply(`${replyTo.id}`, text)
      .then((reply) => {
        updateRow(replyTo.id, (row) => ({ ...row, Replys: [...(row.Replys || []), reply] }))
        message.success(translate('comment-reply-sent'))
        closeReply()
      })
      .catch((err) => {
        message.error(translate('comment-reply-failed', { message: Utils.getErrorMessage(err) }))
      })
      .finally(() => setState((s) => ({ ...s, isSaving: false })))
  }

  const getHideBtn = (comment: IComment) => (
    <Button size={'small'} type="text" onClick={() => toggleHidden(comment)}>
      <Icons.EyeOutlined />
      {translate(comment.isHidden === true ? 'comment-show' : 'comment-hide')}
    </Button>
  )

  const getHiddenTag = (comment: IComment) =>
    comment.isHidden === true ? <Tag>{translate('comment-hidden')}</Tag> : null

  const getReplyRows = (comment: IComment) =>
    getReplies(comment).map((reply) => (
      <Comment
        key={reply.id}
        author={reply.CreatedBy?.nickName || ''}
        avatar={<UserAvatar user={reply.CreatedBy} />}
        actions={getHideBtn(reply)}
        content={
          <CommentDiv>
            {getHiddenTag(reply)}
            {reply.text}
          </CommentDiv>
        }
        datetime={<span>{moment(reply.createdAt).format('lll')}</span>}
      />
    ))

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
        renderItem={(comment: IComment) => {
          return (
            <ListItem key={comment.id}>
              <Comment
                author={comment.CreatedBy?.nickName || ''}
                avatar={<UserAvatar user={comment.CreatedBy} />}
                actions={
                  <>
                    {comment.isHidden === true ? null : (
                      <Button
                        size={'small'}
                        type="link"
                        id={comment.id}
                        onClick={() => setState((s) => ({ ...s, replyTo: comment, replyText: '' }))}
                      >
                        <Icons.CommentOutlined />
                        {translate('reply')}
                      </Button>
                    )}
                    {getHideBtn(comment)}
                  </>
                }
                content={
                  <CommentDiv>
                    <CommentArticleDiv>
                      <Tooltip title={'comments'}>
                        <Link to={getUrl(ARTICLE_DETAILS_URL, ':id', comment.entityId)}>{'Article'}</Link>
                      </Tooltip>
                    </CommentArticleDiv>
                    {getHiddenTag(comment)}
                    {comment.text}
                  </CommentDiv>
                }
                datetime={<span>{moment(comment.createdAt).format('lll')}</span>}
              >
                {getReplyRows(comment)}
              </Comment>
            </ListItem>
          )
        }}
      />
    )
  }

  const getReplyPopup = () => {
    return (
      <Modal
        title={translate('comment-reply-title')}
        open={!!state.replyTo}
        onOk={sendReply}
        okText={translate('comment-reply-send')}
        okButtonProps={{ loading: state.isSaving }}
        onCancel={closeReply}
      >
        <Input.TextArea
          aria-label={translate('comment-reply-label')}
          placeholder={translate('comment-reply-label')}
          value={state.replyText}
          maxLength={MAX_REPLY_LENGTH}
          rows={4}
          onChange={(e) => {
            const replyText = e.target.value
            setState((s) => ({ ...s, replyText }))
          }}
        />
      </Modal>
    )
  }

  return (
    <>
      {getCommentsList()}
      {getReplyPopup()}
    </>
  )
}

// A new article is a new list, so the key resets the page and the results.
const CommentsList = ({ itemId }: { itemId?: string }) => <CommentsListContent key={itemId} itemId={itemId} />

export default CommentsList

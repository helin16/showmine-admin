import styled, { keyframes } from 'styled-components'

type iComment = {
  author: any
  avatar: any
  actions: any
  content: any
  children?: any
  datetime: any
  id?: string
  isHighlighted?: boolean
}

const fadeHighlight = keyframes`
  from {
    background-color: #fff3bf;
  }
  to {
    background-color: transparent;
  }
`

const Wrapper = styled.div`
  position: relative;
  background-color: inherit;
  width: 100%;

  &.comment-highlight {
    animation: ${fadeHighlight} 3s ease-out;
  }

  .ant-comment-inner {
    display: flex;
    padding: 16px 0;

    .ant-comment-avatar {
      position: relative;
      flex-shrink: 0;
      margin-right: 12px;
      cursor: pointer;
    }

    .ant-comment-content {
      position: relative;
      flex: 1 1 auto;
      min-width: 1px;
      font-size: 14px;
      word-wrap: break-word;

      .ant-comment-content-author {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        margin-bottom: 4px;
        font-size: 14px;

        > * {
          padding-right: 8px;
          font-size: 12px;
          line-height: 18px;
        }

        .ant-comment-content-author-name {
          color: #00000073;
          transition: color 0.3s;
        }

        .ant-comment-content-author-time {
          color: #ccc;
          white-space: nowrap;
          cursor: auto;
        }
      }

      .ant-comment-actions {
        margin-top: 12px;
        margin-bottom: inherit;
        padding-left: 0;
      }
    }
  }
`
const Comment = ({ author, datetime, actions, avatar, content, children, id, isHighlighted }: iComment) => {
  return (
    <Wrapper id={id} className={`ant-comment${isHighlighted === true ? ' comment-highlight' : ''}`}>
      <div className={'ant-comment-inner'}>
        <div className={'ant-comment-avatar'}>{avatar}</div>
        <div className={'ant-comment-content'}>
          <div className={'ant-comment-content-author'}>
            <span className={'ant-comment-content-author-name'}>{author}</span>
            <span className={'ant-comment-content-author-time'}>{datetime}</span>
          </div>
          <div className={'ant-comment-content-detail'}>{content}</div>
          <div className={'ant-comment-actions'}>{actions}</div>
          {children}
        </div>
      </div>
    </Wrapper>
  )
}

export default Comment

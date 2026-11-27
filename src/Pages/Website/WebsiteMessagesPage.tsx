import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import moment from 'moment'
import styled from 'styled-components'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_WEBSITE_MESSAGES } from '../../Components/Menu/MenuItems'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import InvalidAccessPanel from '../../Components/Error/InvalidAccessPanel'
import Card from '../../Components/Form/Card'
import Button from '../../Components/Form/Button'
import LoadMoreBtn from '../../Components/Form/LoadMoreBtn'
import List, { ListItem } from '../../Components/Form/List'
import Modal from '../../Components/Form/Modal'
import Spin from '../../Components/Form/Spin'
import Tag from '../../Components/Form/Tag'
import message from '../../Components/Form/message'
import WebsiteService from '../../Services/WebsiteService'
import Utils from '../../Services/Utils'
import translate from '../../i18n/translate'
import { IWebsiteMessage } from '../../Types/Website/IWebsite'
import { UNREAD_EVENT } from '../../Components/Website/WebsiteMessagesMenuName'

// Visitors' messages from the website's message forms (specs/006-website-message-form). Admins only (the route): they
// hold visitors' personal data. Opening one marks it read. An address is encoded in its mailto link (all but the @),
// so nothing in it can add recipients or text.
const PAGE_SIZE = 20

const MessageText = styled.div`
  white-space: pre-wrap;
  margin-top: 8px;
`

type iState = {
  loading: boolean
  messages: IWebsiteMessage[]
  page: number
  totalPages: number
  unread: number
  openIds: string[]
  deleting?: IWebsiteMessage
  isDeleting: boolean
}
const initState: iState = {
  loading: false,
  messages: [],
  page: 0,
  totalPages: 0,
  unread: 0,
  openIds: [],
  isDeleting: false,
}

const WebsiteMessagesPage = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const isOn = company?.websiteBuilderEnabled === true
  const [state, setState] = useState(initState)
  // A load for another company, finished after a switch, is dropped.
  const companyIdRef = useRef(company?.id)
  companyIdRef.current = company?.id

  const load = (page: number) => {
    const companyId = company?.id
    setState((s) => ({ ...s, loading: true }))
    WebsiteService.getMessages(page, PAGE_SIZE)
      .then(({ data, pagination, unread }) => {
        if (companyIdRef.current !== companyId) return
        setState((s) => ({
          ...s,
          loading: false,
          messages: page === 1 ? data : [...s.messages, ...data.filter((m) => !s.messages.some((o) => o.id === m.id))],
          page,
          totalPages: pagination.totalPages,
          unread,
        }))
      })
      .catch((err) => {
        if (companyIdRef.current !== companyId) return
        setState((s) => ({ ...s, loading: false }))
        message.error(translate('website-messages-load-failed', { message: Utils.getErrorMessage(err) }))
      })
  }

  useEffect(() => {
    if (!isOn) return
    setState(initState)
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, isOn])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(UNREAD_EVENT, { detail: state.unread }))
  }, [state.unread])

  const open = (item: IWebsiteMessage) => {
    const companyId = company?.id
    setState((s) => ({ ...s, openIds: [...s.openIds, item.id] }))
    if (item.isRead) return
    WebsiteService.markMessageRead(item.id)
      .then(() =>
        companyIdRef.current !== companyId
          ? undefined
          : setState((s) => ({
              ...s,
              unread: Math.max(0, s.unread - 1),
              messages: s.messages.map((m) => (m.id === item.id ? { ...m, isRead: true } : m)),
            })),
      )
      .catch((err) => message.error(translate('website-messages-read-failed', { message: Utils.getErrorMessage(err) })))
  }

  const remove = () => {
    const item = state.deleting
    if (!item) return
    const companyId = company?.id
    setState((s) => ({ ...s, isDeleting: true }))
    WebsiteService.deleteMessage(item.id)
      .then(() => {
        if (companyIdRef.current !== companyId) return
        setState((s) => ({
          ...s,
          isDeleting: false,
          deleting: undefined,
          unread: item.isRead ? s.unread : Math.max(0, s.unread - 1),
          messages: s.messages.filter((m) => m.id !== item.id),
        }))
        message.success(translate('website-messages-deleted'))
      })
      .catch((err) => {
        setState((s) => ({ ...s, isDeleting: false }))
        message.error(translate('website-messages-delete-failed', { message: Utils.getErrorMessage(err) }))
      })
  }

  const getItem = (item: IWebsiteMessage) => {
    const name = `${item.firstName} ${item.lastName}`
    const isOpen = state.openIds.includes(item.id)
    return (
      <ListItem
        key={item.id}
        actions={[
          ...(isOpen
            ? []
            : [
                <Button
                  key={'open'}
                  onClick={() => open(item)}
                  aria-label={translate('website-messages-open', { name })}
                >
                  {translate('website-messages-open-short')}
                </Button>,
              ]),
          <Button
            key={'delete'}
            danger
            onClick={() => setState((s) => ({ ...s, deleting: item }))}
            aria-label={translate('website-messages-delete', { name })}
          >
            {translate('website-messages-delete-short')}
          </Button>,
        ]}
      >
        <div>
          <div>
            <strong>{name}</strong>{' '}
            <a href={`mailto:${encodeURIComponent(item.email).replace(/%40/g, '@')}`}>{item.email}</a>{' '}
            {item.isRead ? null : <Tag color={'blue'}>{translate('website-messages-unread')}</Tag>}
          </div>
          <small>
            {moment(item.createdAt).format('YYYY-MM-DD HH:mm')} · /{item.pageSlug}
          </small>
          {isOpen ? <MessageText>{item.message}</MessageText> : null}
        </div>
      </ListItem>
    )
  }

  return (
    <BackendPage
      selectedMenu={MENU_KEY_WEBSITE_MESSAGES}
      ContentHeader={
        <BackendPageContentTitle
          title={translate('website-messages')}
          description={
            state.unread > 0 ? translate('website-messages-unread-count', { count: state.unread }) : undefined
          }
        />
      }
    >
      {isOn ? (
        <Card>
          <Spin spinning={state.loading}>
            <List
              dataSource={state.messages}
              renderItem={getItem}
              locale={{ emptyText: translate('website-messages-empty') }}
            />
            <LoadMoreBtn
              showing={state.page < state.totalPages}
              loading={state.loading}
              onClick={() => load(state.page + 1)}
            />
          </Spin>
          <Modal
            title={translate('website-messages-delete-title')}
            open={!!state.deleting}
            onOk={remove}
            okText={translate('website-messages-delete-short')}
            okButtonProps={{ danger: true, loading: state.isDeleting }}
            onCancel={() => setState((s) => ({ ...s, deleting: undefined }))}
          >
            {translate('website-messages-delete-confirm')}
          </Modal>
        </Card>
      ) : (
        <InvalidAccessPanel />
      )}
    </BackendPage>
  )
}

export default WebsiteMessagesPage

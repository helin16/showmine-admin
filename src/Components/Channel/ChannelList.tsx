import React, { useEffect, useState } from 'react'
import moment from 'moment'
import IChannel from '../../Types/Channel/IChannel'
import ChannelService from '../../Services/ChannelService'
import ChannelIcon from './ChannelIcon'
import ChannelPopupEditor from './ChannelPopupEditor'
import translate from '../../i18n/translate'
import message from '../Form/message'
import Button from '../Form/Button'
import List, { ListItem, ListItemMeta } from '../Form/List'
import Icons from '../Icons'
import PopConfirm from '../Form/Popconfirm'
import Spin from '../Form/Spin'
import Alert from '../Form/Alert'
import Utils from '../../Services/Utils'

type iState = {
  loading: boolean
  loadingErr?: string
  list: IChannel[]
  updatingChannelId: string
}
const initialState: iState = {
  loading: false,
  list: [],
  updatingChannelId: '',
}
const ChannelList = () => {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    setState((s) => ({
      ...s,
      loading: true,
      loadingErr: undefined,
    }))
    let isCancelled = false
    ChannelService.getAll({
      where: JSON.stringify({ isActive: true }),
      perPage: 9999,
      currentPage: 1,
      sort: 'name:ASC',
    })
      .then((res) => {
        if (isCancelled === true) return
        setState((s) => ({
          ...s,
          loading: false,
          list: res.data,
        }))
      })
      .catch((err) => {
        if (isCancelled === true) return
        setState((s) => ({
          ...s,
          loading: false,
          loadingErr: translate('error-getting-channel', { message: Utils.getErrorMessage(err) }),
          list: [],
        }))
      })
    return () => {
      isCancelled = true
    }
  }, [])

  const removeChannel = (channel: IChannel) => {
    const channelId = `${channel.id || ''}`
    setState((s) => ({
      ...s,
      updatingChannelId: channelId,
    }))
    ChannelService.deactivate(channelId)
      .then(() => {
        message.success(translate('channel-deleted', { name: channel.name }))
        setState((s) => ({
          ...s,
          list: s.list.filter((chan: IChannel) => chan.id !== channelId),
        }))
      })
      .catch((err) => {
        message.error(translate('error-channel-delete', { name: channel.name, message: Utils.getErrorMessage(err) }))
      })
      .finally(() => {
        setState((s) => ({
          ...s,
          updatingChannelId: '',
        }))
      })
  }

  const channelSaved = (saved: IChannel) => {
    setState((s) => ({
      ...s,
      list: s.list.map((chan: IChannel) => (chan.id === saved.id ? saved : chan)),
    }))
  }

  if (state.loadingErr) {
    return <Alert type='error' message={state.loadingErr} />
  }

  // Only the seeded main channel is on-boarded: it can't be deleted, same as the old "Showmine" channel.
  const getActions = (channel: IChannel) =>
    channel.isOnBoarded === true
      ? []
      : [
          <PopConfirm
            key='delete'
            title={<div>{translate('confirm-delete', { text: channel.name })}</div>}
            onConfirm={() => removeChannel(channel)}
            okText={translate('yes')}
            cancelText={translate('no')}
          >
            <Button danger type='text'>
              <Icons.DeleteOutlined />
              {translate('delete')}
            </Button>
          </PopConfirm>,
        ]

  return (
    <Spin spinning={state.updatingChannelId !== ''}>
      <List
        className='channel-list'
        loading={state.loading}
        itemLayout='horizontal'
        dataSource={state.list}
        renderItem={(channel: IChannel) => (
          <ListItem actions={getActions(channel)}>
            <ListItemMeta
              avatar={<ChannelIcon channel={channel} />}
              title={
                <ChannelPopupEditor channel={channel} onSaved={channelSaved}>
                  {channel.name}
                </ChannelPopupEditor>
              }
              description={<div>{moment(channel.createdAt).format('ll')}</div>}
            />
          </ListItem>
        )}
      />
    </Spin>
  )
}

export default ChannelList

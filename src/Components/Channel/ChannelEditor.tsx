import React from 'react'
import IChannel from '../../Types/Channel/IChannel'
import ShowMineChannelEditor, { iEditingChannel } from './Wizard/ShowMineChannelEditor'

type iChannelEditor = {
  channel?: iEditingChannel
  onSaved?: (saved: IChannel) => void
  onCancel?: () => void
}
// The API only takes a name and a script: RedirectChannelEditor and WordPressChannelEditor wait for it to do more.
const ChannelEditor = ({ channel, onSaved, onCancel }: iChannelEditor) => {
  if (!channel) {
    return null
  }
  return <ShowMineChannelEditor channel={channel} onSaved={onSaved} onCancel={onCancel} />
}

export default ChannelEditor

import React from 'react'
import IChannel from '../../../Types/Channel/IChannel'

type iData = {
  name: string
  type: string
  credential: {
    wpUrl: string
    wpUserName: string
    wpPassword: string
  }
}
const initialData: iData = {
  name: '',
  type: '',
  credential: {
    wpUrl: '',
    wpUserName: '',
    wpPassword: '',
  },
}
type iState = {
  channel?: IChannel
  saving: boolean
  data: iData
  error: { [key: string]: string }
}
const initialState: iState = {
  saving: false,
  data: initialData,
  error: {},
}
type iWordPressChannelEditor = {
  channel: IChannel
  onSaved?: (channel: IChannel) => void;
  onCancel?: () => void;
}
const WordPressChannelEditor = ({ channel, onSaved, onCancel }: iWordPressChannelEditor) => {
  return <div />
}

export default WordPressChannelEditor

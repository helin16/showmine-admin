import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import IChannel from '../../Types/Channel/IChannel'
import {
  CHANNEL_TYPE_SHOW_MINE,
  CHANNEL_TYPE_FACEBOOK,
  CHANNEL_TYPE_GOOGLE,
  CHANNEL_TYPE_LINKED_IN,
  CHANNEL_TYPE_TWITTER,
  CHANNEL_TYPE_WORDPRESS,
} from '../../Constants'
import WordPressChannelEditor from './Wizard/WordPressChannelEditor'
import RedirectChannelEditor from './Wizard/RedirectChannelEditor'
import ICompany from '../../Types/Company/ICompany'
import ShowMineChannelEditor from './Wizard/ShowMineChannelEditor'

const ChannelEditorWrapper = styled.div``
type iState = {
  channel?: IChannel
  company?: ICompany
}
const initialState: iState = {};
type iChannelEditor = {
  channel?: IChannel
  onSaved?: (saved: IChannel) => void;
  onCancel?: () => void;
}
const ChannelEditor = ({
  channel,
  onSaved,
  onCancel,
}: iChannelEditor) => {
  return null
  // const [state, setState] = useState({ ...initialState, channel });
  //
  // useEffect(() => {
  //   if (!channel) return;
  //   setState((s) => ({
  //     ...s,
  //     channel,
  //   }));
  // }, [channel]);
  //
  // const getEditor = () => {
  //   if (!state.channel) {
  //     return null;
  //   }
  //   const channelName = state.channel.type.toLowerCase();
  //   if (channelName === CHANNEL_TYPE_SHOW_MINE.toLowerCase()) {
  //     return <ShowMineChannelEditor channel={state.channel}
  //     onSaved={onSaved} onCancel={onCancel} company={state.company}/>;
  //   }
  //   if (channelName === CHANNEL_TYPE_FACEBOOK.toLowerCase()) {
  //     return <RedirectChannelEditor channel={state.channel}
  //     onSaved={onSaved} onCancel={onCancel} company={state.company}/>;
  //   }
  //   if (channelName === CHANNEL_TYPE_GOOGLE.toLowerCase()) {
  //     return <RedirectChannelEditor channel={state.channel}
  //     onSaved={onSaved} onCancel={onCancel} company={state.company}/>;
  //   }
  //   if (channelName === CHANNEL_TYPE_TWITTER.toLowerCase()) {
  //     return <RedirectChannelEditor channel={state.channel}
  //     onSaved={onSaved} onCancel={onCancel} company={state.company}/>;
  //   }
  //   if (channelName === CHANNEL_TYPE_LINKED_IN.toLowerCase()) {
  //     return <RedirectChannelEditor channel={state.channel}
  //     onSaved={onSaved} onCancel={onCancel} company={state.company}/>;
  //   }
  //   if (channelName === CHANNEL_TYPE_WORDPRESS.toLowerCase()) {
  //     return <WordPressChannelEditor channel={state.channel}
  //     onSaved={onSaved} onCancel={onCancel} company={state.company}/>;
  //   }
  //   return null;
  // };
  //
  // return (
  //   <ChannelEditorWrapper>
  //     {getEditor()}
  //   </ChannelEditorWrapper>
  // );
}

export default ChannelEditor

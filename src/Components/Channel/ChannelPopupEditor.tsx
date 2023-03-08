import React, { useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import IChannel from '../../Types/Channel/IChannel';
import ChannelEditor from './ChannelEditor';
import { RootState } from '../../Redux/makeReduxStore';
import Modal from '../Form/Modal';

const ChannelPopupEditorWrapper = styled.div`
  .clickable {
    cursor: pointer;
  }
`;

type iChannelPopupEditor = {
  channel?: IChannel,
  children: React.ComponentProps<any>;
  onSaved?: (newChannel: IChannel) => void;
}
const ChannelPopupEditor = ({ children, channel, onSaved }: iChannelPopupEditor) => {
  const { company } = useSelector((s: RootState) => s.auth);
  const [showing, setShowing] = useState(false);


  return (
    <ChannelPopupEditorWrapper>
      <div className={'clickable'} onClick={() => setShowing(true)}>{children}</div>
      <Modal
        title={(channel && channel.id) ? `Editing ${channel.name}:` : 'Creating a Channel:'}
        width={'80%'}
        open={showing === true}
        footer={null}
        onCancel={() => setShowing(false)}
      >
        <ChannelEditor channel={channel}
           onCancel={() => setShowing(false)}
           company={(!company || company === null) ? undefined : company }
           onSaved={(newChannel: IChannel) => {
             setShowing(false);
             onSaved && onSaved(newChannel)
           }}
        />
      </Modal>
    </ChannelPopupEditorWrapper>
  );
};


export default ChannelPopupEditor;

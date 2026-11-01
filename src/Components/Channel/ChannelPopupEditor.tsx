import React, { useState } from 'react'
import styled from 'styled-components'
import IChannel from '../../Types/Channel/IChannel'
import ChannelEditor from './ChannelEditor'
import Modal from '../Form/Modal'
import translate from '../../i18n/translate'

const ChannelPopupEditorWrapper = styled.div`
  .clickable {
    cursor: pointer;
  }
`

type iChannelPopupEditor = {
  channel?: IChannel
  children: React.ComponentProps<any>
  onSaved?: (newChannel: IChannel) => void
}
const ChannelPopupEditor = ({ children, channel, onSaved }: iChannelPopupEditor) => {
  const [showing, setShowing] = useState(false)

  return (
    <ChannelPopupEditorWrapper>
      <div className={'clickable'} onClick={() => setShowing(true)}>
        {children}
      </div>
      <Modal
        title={channel && channel.id ? translate('channel-editing', { name: channel.name }) : translate('channel-creating')}
        width={'80%'}
        open={showing === true}
        footer={null}
        onCancel={() => setShowing(false)}
      >
        {showing !== true ? null : (
          <ChannelEditor
            channel={channel}
            onCancel={() => setShowing(false)}
            onSaved={(newChannel: IChannel) => {
              setShowing(false)
              onSaved?.(newChannel)
            }}
          />
        )}
      </Modal>
    </ChannelPopupEditorWrapper>
  )
}

export default ChannelPopupEditor

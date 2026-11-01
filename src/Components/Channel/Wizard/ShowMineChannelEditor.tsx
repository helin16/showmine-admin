import React, { useState } from 'react'
import IChannel from '../../../Types/Channel/IChannel'
import ChannelIcon from '../ChannelIcon'
import ChannelService from '../../../Services/ChannelService'
import { BoxTitleDiv, FormInputWrapper } from '../../../Styles/AppWrapper'
import InlineInput from '../../Form/InlineInput'
import Typography from '../../Form/Typography'
import Space from '../../Form/Space'
import Button from '../../Form/Button'
import Icons from '../../Icons'
import message from '../../Form/message'
import translate from '../../../i18n/translate'
import Utils from '../../../Services/Utils'

export type iEditingChannel = Pick<IChannel, 'id' | 'name' | 'scriptId'>

type iShowMineChannelEditor = {
  channel: iEditingChannel
  onSaved?: (saved: IChannel) => void
  onCancel?: () => void
}
const ShowMineChannelEditor = ({ channel, onSaved, onCancel }: iShowMineChannelEditor) => {
  const [name, setName] = useState(channel.name)
  const [isNameMissing, setIsNameMissing] = useState(false)
  const [saving, setSaving] = useState(false)
  const channelType = translate('channel-type-wechat')

  const nameChanged = (newValue: string) => {
    setName(newValue)
    setIsNameMissing(newValue.trim() === '')
  }

  const handleClicked = () => {
    const newName = name.trim()
    if (newName === '') {
      setIsNameMissing(true)
      return
    }
    setSaving(true)
    const saveFunc = channel.id
      ? ChannelService.update(channel.id, { name: newName })
      : ChannelService.create({ name: newName, scriptId: channel.scriptId })

    saveFunc
      .then((res) => {
        message.success(channel.id ? translate('channel-updated', { name: newName }) : translate('channel-connected'))
        if (typeof onSaved === 'function') {
          onSaved(res)
        }
      })
      .catch((err) => {
        const error = Utils.getErrorMessage(err)
        message.error(
          channel.id
            ? translate('error-channel-update', { name: channel.name, message: error })
            : translate('channel-connected-error', { message: error }),
        )
      })
      .finally(() => {
        setSaving(false)
      })
  }

  return (
    <div>
      <FormInputWrapper className={isNameMissing ? 'danger' : ''}>
        <BoxTitleDiv>
          {translate('name-channel', { name: channelType })}
          <Typography.Text type={'danger'}>*</Typography.Text>
        </BoxTitleDiv>
        <InlineInput
          className={'input-wrapper'}
          allowClear
          type={'text'}
          prefix={<ChannelIcon channel={channel} />}
          value={name}
          onChange={nameChanged}
          placeholder={translate('name-type', { type: channelType })}
        />
        {isNameMissing ? (
          <Typography.Text type={'danger'}>
            {translate('fieldIsRequired', { fieldName: translate('name') })}
          </Typography.Text>
        ) : null}
      </FormInputWrapper>

      <FormInputWrapper style={{ textAlign: 'right' }}>
        <Space>
          {typeof onCancel === 'function' ? (
            <Button type={'link'} onClick={() => onCancel()}>
              {translate('cancel')}
            </Button>
          ) : null}
          <Button type={'primary'} icon={<Icons.ApiOutlined />} onClick={handleClicked} loading={saving}>
            {translate(channel.id ? 'save' : 'connect')}
          </Button>
        </Space>
      </FormInputWrapper>
    </div>
  )
}

export default ShowMineChannelEditor

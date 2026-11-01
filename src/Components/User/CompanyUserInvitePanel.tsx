import React, { useState } from 'react'
import { MailOutlined, SendOutlined, WechatOutlined } from '@ant-design/icons'
import { QRCodeCanvas } from 'qrcode.react'
import { FormattedMessage, useIntl } from 'react-intl'
import CompanyUserService from '../../Services/CompanyUserService'
import Utils from '../../Services/Utils'
import Button from '../Form/Button'
import Form from '../Form/Form'
import FormItem from '../Form/FormItem'
import InputBox from '../Form/InputBox'
import message from '../Form/message'
import Space from '../Form/Space'
import Typography from '../Form/Typography'

const QR_SIZE = 180

const CompanyUserInvitePanel = () => {
  const [isSending, setIsSending] = useState(false)
  const [isLoadingQr, setIsLoadingQr] = useState(false)
  const [qr, setQr] = useState<{ url: string; expiresInSeconds: number } | null>(null)
  const [formKey, setFormKey] = useState(0)
  const intl = useIntl()

  const onFinish = ({ email }: { email: string }) => {
    setIsSending(true)
    CompanyUserService.invite(email)
      .then(() => {
        message.success(intl.formatMessage({ id: 'invite-sent' }, { email }))
        setFormKey((key) => key + 1)
      })
      .catch((err) => message.error(Utils.getErrorMessage(err)))
      .finally(() => setIsSending(false))
  }

  const showQr = () => {
    setIsLoadingQr(true)
    CompanyUserService.getInviteQr()
      .then(setQr)
      .catch((err) => message.error(Utils.getErrorMessage(err)))
      .finally(() => setIsLoadingQr(false))
  }

  const emailLabel = intl.formatMessage({ id: 'email' })
  return (
    <Space orientation='vertical' size='middle'>
      <Typography.Text strong>
        <FormattedMessage id='invite-people' />
      </Typography.Text>
      <Form key={formKey} layout='inline' name='invite form' onFinish={onFinish}>
        <FormItem
          label={emailLabel}
          name='email'
          rules={[
            { required: true, message: intl.formatMessage({ id: 'email-required' }) },
            { type: 'email', message: intl.formatMessage({ id: 'email-invalid' }) },
          ]}
        >
          <InputBox placeholder={emailLabel} prefix={<MailOutlined />} autoComplete='off' />
        </FormItem>
        <FormItem>
          <Button type='primary' htmlType='submit' icon={<SendOutlined />} loading={isSending}>
            <FormattedMessage id='invite-send' />
          </Button>
        </FormItem>
      </Form>
      <Button icon={<WechatOutlined />} onClick={showQr} loading={isLoadingQr}>
        <FormattedMessage id='invite-qr-show' />
      </Button>
      {qr === null ? null : (
        <div>
          <QRCodeCanvas value={qr.url} size={QR_SIZE} />
          <Typography.Paragraph>
            <FormattedMessage id='invite-qr-help' values={{ minutes: Math.round(qr.expiresInSeconds / 60) }} />
          </Typography.Paragraph>
        </div>
      )}
    </Space>
  )
}

export default CompanyUserInvitePanel

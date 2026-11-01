import React, { useState } from 'react'
import { MailOutlined, SendOutlined } from '@ant-design/icons'
import { FormattedMessage, useIntl } from 'react-intl'
import Utils from '../../Services/Utils'
import AuthService from '../../Services/AuthService'
import { PASSWORD_LOGIN_URL } from '../../UrlMap'
import Alert from '../Form/Alert'
import Button from '../Form/Button'
import Form from '../Form/Form'
import FormItem from '../Form/FormItem'
import InputBox from '../Form/InputBox'
import Result from '../Form/Result'
import Typography from '../Form/Typography'

type iError = { title: string; detail: string }

const RetrievePasswordForm = () => {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<iError>()
  const intl = useIntl()

  const onFinish = ({ email }: { email: string }) => {
    setSubmitting(true)
    setError(undefined)
    // The answer is never looked at: whether the account exists must not show.
    AuthService.retrievePassword(email)
      .then(() => setSubmitted(true))
      .catch((err) => {
        const title = err.response?.status === 429 ? 'request-too-many' : 'request-not-sent'
        setError({ title: intl.formatMessage({ id: title }), detail: Utils.getErrorMessage(err) })
      })
      .finally(() => setSubmitting(false))
  }

  const backToLogin = (
    <Button href={PASSWORD_LOGIN_URL} type={'link'}>
      <FormattedMessage id='back-to-login' />
    </Button>
  )

  if (submitted === true) {
    return <Result status='info' subTitle={<FormattedMessage id='forgot-password-sent' />} extra={backToLogin} />
  }

  return (
    <Form layout='vertical' name='forgot password form' onFinish={onFinish}>
      <h1>
        <FormattedMessage id='reset-password' />
      </h1>
      <Typography.Paragraph>
        <FormattedMessage id='forgot-password-intro' />
      </Typography.Paragraph>
      <FormItem
        label={intl.formatMessage({ id: 'email' })}
        name='email'
        rules={[
          { required: true, message: intl.formatMessage({ id: 'email-required' }) },
          { type: 'email', message: intl.formatMessage({ id: 'email-invalid' }) },
        ]}
      >
        <InputBox placeholder={intl.formatMessage({ id: 'email' })} prefix={<MailOutlined />} autoComplete='email' />
      </FormItem>
      {error ? (
        <FormItem>
          <Alert message={error.title} description={error.detail} type='error' />
        </FormItem>
      ) : null}
      <FormItem>
        <Button type='primary' htmlType='submit' block icon={<SendOutlined />} loading={submitting}>
          <FormattedMessage id='send-reset-link' />
        </Button>
      </FormItem>
      {backToLogin}
    </Form>
  )
}

export default RetrievePasswordForm

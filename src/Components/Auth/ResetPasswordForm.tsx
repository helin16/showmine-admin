import React, { useEffect, useState } from 'react'
import { LockOutlined } from '@ant-design/icons'
import { FormattedMessage, useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import Utils from '../../Services/Utils'
import AuthService from '../../Services/AuthService'
import { FORGOT_PASSWORD_URL, PASSWORD_LOGIN_URL } from '../../UrlMap'
import Alert from '../Form/Alert'
import Button from '../Form/Button'
import Form from '../Form/Form'
import FormItem from '../Form/FormItem'
import InputPassword from '../Form/InputPassword'
import message from '../Form/message'
import Result from '../Form/Result'

const MIN_PASSWORD_LENGTH = 8

const ResetPasswordForm = () => {
  // Read straight from the address and only once, as the effect below removes it.
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  // Why the link can't be used, if the API said: null means it still can.
  const [linkError, setLinkError] = useState<string | null>(token === '' ? '' : null)
  const navigate = useNavigate()
  const intl = useIntl()

  // history.state stays, as the router keeps its place in it.
  useEffect(() => {
    window.history.replaceState(window.history.state, '', window.location.pathname)
  }, [])

  const onFinish = ({ password }: { password: string }) => {
    setSubmitting(true)
    setError('')
    AuthService.resetPassword(token, password)
      .then(() => {
        // A session left in this browser would send the sign-in page straight to the dashboard.
        AuthService.removeLocalAuthToken()
        message.success(intl.formatMessage({ id: 'reset-password-done' }))
        navigate(PASSWORD_LOGIN_URL, { replace: true })
      })
      .catch((err) => {
        setSubmitting(false)
        if (err.response?.status === 400) {
          setLinkError(Utils.getErrorMessage(err))
          return
        }
        setError(Utils.getErrorMessage(err))
      })
  }

  if (linkError !== null) {
    return (
      <Result
        status='warning'
        title={<FormattedMessage id='reset-link-invalid' />}
        subTitle={linkError}
        extra={
          <Button type='primary' href={FORGOT_PASSWORD_URL}>
            <FormattedMessage id='request-new-link' />
          </Button>
        }
      />
    )
  }

  const newPassword = intl.formatMessage({ id: 'new-password' })
  const confirmPassword = intl.formatMessage({ id: 'confirm-password' })
  const required = { required: true, message: intl.formatMessage({ id: 'password-too-short' }) }
  return (
    <Form layout='vertical' name='reset password form' onFinish={onFinish}>
      <h1>
        <FormattedMessage id='reset-password' />
      </h1>
      <FormItem
        label={newPassword}
        name='password'
        rules={[required, { min: MIN_PASSWORD_LENGTH, message: required.message }]}
      >
        <InputPassword placeholder={newPassword} prefix={<LockOutlined />} autoComplete='new-password' />
      </FormItem>
      <FormItem
        label={confirmPassword}
        name='confirmPassword'
        dependencies={['password']}
        rules={[
          required,
          ({ getFieldValue }) => ({
            validator: (_rule, value) =>
              !value || value === getFieldValue('password')
                ? Promise.resolve()
                : Promise.reject(new Error(intl.formatMessage({ id: 'confirm-password-diff' }))),
          }),
        ]}
      >
        <InputPassword placeholder={confirmPassword} prefix={<LockOutlined />} autoComplete='new-password' />
      </FormItem>
      {error === '' ? null : (
        <FormItem>
          <Alert message={intl.formatMessage({ id: 'request-not-sent' })} description={error} type='error' />
        </FormItem>
      )}
      <FormItem>
        <Button type='primary' htmlType='submit' block loading={submitting}>
          <FormattedMessage id='reset-password' />
        </Button>
      </FormItem>
    </Form>
  )
}

export default ResetPasswordForm

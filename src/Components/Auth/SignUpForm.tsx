import React, { useEffect, useState } from 'react'
import { MailOutlined, SendOutlined, ShopOutlined, UserOutlined } from '@ant-design/icons'
import { FormattedMessage, useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import AuthService from '../../Services/AuthService'
import Utils from '../../Services/Utils'
import { PASSWORD_LOGIN_URL, SIGN_UP_URL, WIZARD_URL } from '../../UrlMap'
import Alert from '../Form/Alert'
import Button from '../Form/Button'
import Form from '../Form/Form'
import FormItem from '../Form/FormItem'
import InputBox from '../Form/InputBox'
import Result from '../Form/Result'
import Spin from '../Form/Spin'
import Typography from '../Form/Typography'
import NewPasswordFields from './NewPasswordFields'

const MAX_NAME_LENGTH = 255

type iRequestError = { response?: { status?: number } }
type iDetails = { companyName: string; firstName: string; lastName?: string; password: string }

const SignUpForm = () => {
  // Read straight from the address and only once, as the effect below removes it.
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '')
  const [email, setEmail] = useState<string | null>(null)
  // Why the link can't be used, if the API said: null means it still can.
  const [linkError, setLinkError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const intl = useIntl()
  const navigate = useNavigate()

  // history.state stays, as the router keeps its place in it.
  useEffect(() => {
    window.history.replaceState(window.history.state, '', window.location.pathname)
  }, [])

  useEffect(() => {
    if (token === '') return
    let isCancelled = false
    AuthService.checkSignUp(token)
      .then((res) => {
        if (isCancelled === true) return
        setEmail(res.email)
      })
      .catch((err) => {
        if (isCancelled === true) return
        setLinkError(err.response?.status === 400 ? '' : Utils.getErrorMessage(err))
      })
    return () => {
      isCancelled = true
    }
  }, [token])

  const start = () => {
    setSubmitting(true)
    setError('')
  }

  const onFailure = (err: iRequestError) => {
    setSubmitting(false)
    setError(
      err.response?.status === 429 ? intl.formatMessage({ id: 'request-too-many' }) : Utils.getErrorMessage(err),
    )
  }

  const onRequest = (values: { email: string }) => {
    start()
    AuthService.signUp(values.email)
      .then(() => setSent(true))
      .catch(onFailure)
  }

  const onComplete = (details: iDetails) => {
    start()
    AuthService.completeSignUp(token, details)
      .then((res) => {
        AuthService.setLocalAuthToken(res.token)
        navigate(WIZARD_URL)
      })
      .catch(onFailure)
  }

  const backToLogin = (
    <Button href={PASSWORD_LOGIN_URL} type='link' block>
      <FormattedMessage id='sign-up-have-account' />
    </Button>
  )
  const errorAlert =
    error === '' ? null : (
      <FormItem>
        <Alert message={intl.formatMessage({ id: 'request-not-sent' })} description={error} type='error' />
      </FormItem>
    )

  if (linkError !== null) {
    return (
      <Result
        status='warning'
        title={<FormattedMessage id='sign-up-link-invalid' />}
        subTitle={linkError === '' ? <FormattedMessage id='sign-up-link-help' /> : linkError}
        extra={
          <Button type='primary' href={SIGN_UP_URL}>
            <FormattedMessage id='sign-up-new-link' />
          </Button>
        }
      />
    )
  }

  if (sent === true) {
    return <Result status='info' subTitle={<FormattedMessage id='sign-up-sent' />} extra={backToLogin} />
  }

  if (token === '') {
    const emailLabel = intl.formatMessage({ id: 'email' })
    return (
      <Form layout='vertical' name='sign up form' onFinish={onRequest}>
        <h1>
          <FormattedMessage id='sign-up' />
        </h1>
        <Typography.Paragraph>
          <FormattedMessage id='sign-up-intro' />
        </Typography.Paragraph>
        <FormItem
          label={emailLabel}
          name='email'
          rules={[
            { required: true, message: intl.formatMessage({ id: 'email-required' }) },
            { type: 'email', message: intl.formatMessage({ id: 'email-invalid' }) },
          ]}
        >
          <InputBox placeholder={emailLabel} prefix={<MailOutlined />} autoComplete='email' />
        </FormItem>
        {errorAlert}
        <FormItem>
          <Button type='primary' htmlType='submit' block icon={<SendOutlined />} loading={submitting}>
            <FormattedMessage id='sign-up-send' />
          </Button>
        </FormItem>
        {backToLogin}
      </Form>
    )
  }

  if (email === null) {
    return (
      <div role='status'>
        <Spin spinning />
      </div>
    )
  }

  const required = (id: string) => [{ required: true, whitespace: true, message: intl.formatMessage({ id }) }]
  const companyName = intl.formatMessage({ id: 'company-name' })
  const firstName = intl.formatMessage({ id: 'first-name' })
  const lastName = intl.formatMessage({ id: 'last-name' })
  return (
    <Form layout='vertical' name='finish sign up form' onFinish={onComplete}>
      <h1>
        <FormattedMessage id='sign-up-finish' />
      </h1>
      <Typography.Paragraph>
        <FormattedMessage id='sign-up-for' values={{ email }} />
      </Typography.Paragraph>
      <FormItem label={companyName} name='companyName' rules={required('company-name-required')}>
        <InputBox placeholder={companyName} prefix={<ShopOutlined />} autoComplete='organization' maxLength={MAX_NAME_LENGTH} />
      </FormItem>
      <FormItem label={firstName} name='firstName' rules={required('first-name-required')}>
        <InputBox placeholder={firstName} prefix={<UserOutlined />} autoComplete='given-name' maxLength={MAX_NAME_LENGTH} />
      </FormItem>
      <FormItem label={lastName} name='lastName'>
        <InputBox placeholder={lastName} prefix={<UserOutlined />} autoComplete='family-name' maxLength={MAX_NAME_LENGTH} />
      </FormItem>
      <NewPasswordFields />
      {errorAlert}
      <FormItem>
        <Button type='primary' htmlType='submit' block loading={submitting}>
          <FormattedMessage id='sign-up-create' />
        </Button>
      </FormItem>
    </Form>
  )
}

export default SignUpForm

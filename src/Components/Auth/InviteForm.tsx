import React, { useEffect, useState } from 'react'
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { FormattedMessage, useIntl } from 'react-intl'
import AuthService from '../../Services/AuthService'
import Utils from '../../Services/Utils'
import { BACK_END_URL, FORGOT_PASSWORD_URL, PASSWORD_LOGIN_URL } from '../../UrlMap'
import Alert from '../Form/Alert'
import Button from '../Form/Button'
import Form from '../Form/Form'
import FormItem from '../Form/FormItem'
import InputBox from '../Form/InputBox'
import InputPassword from '../Form/InputPassword'
import Result from '../Form/Result'
import Spin from '../Form/Spin'
import Typography from '../Form/Typography'
import NewPasswordFields from './NewPasswordFields'

const MAX_NAME_LENGTH = 255

type iNewPerson = { firstName: string; lastName?: string; password: string }
type iAccount = { email: string; password: string }

const InviteForm = () => {
  // Read straight from the address and only once, as the effect below removes it.
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '')
  const [invite, setInvite] = useState<{ companyName: string; email: string } | null>(null)
  // Why the link can't be used, if the API said: null means it still can.
  const [linkError, setLinkError] = useState<string | null>(token === '' ? '' : null)
  const [done, setDone] = useState<'requested' | 'pending' | 'member' | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(() => `${AuthService.getLocalAuthToken() || ''}`.trim() !== '')
  const [hasAccount, setHasAccount] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const intl = useIntl()

  // history.state stays, as the router keeps its place in it.
  useEffect(() => {
    window.history.replaceState(window.history.state, '', window.location.pathname)
  }, [])

  useEffect(() => {
    if (token === '') return
    let isCancelled = false
    AuthService.checkInvite(token)
      .then((res) => {
        if (isCancelled === true) return
        setInvite(res)
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

  const onFailure = (err: { response?: { status?: number } }) => {
    setSubmitting(false)
    if (err.response?.status === 400) {
      setLinkError('')
      return
    }
    setError(Utils.getErrorMessage(err))
  }

  const join = () =>
    AuthService.joinInvite(token)
      .then(({ status }) => setDone(status))
      .catch(onFailure)

  const onJoin = () => {
    start()
    join()
  }

  const onNewPerson = ({ firstName, lastName, password }: iNewPerson) => {
    start()
    AuthService.acceptInvite(token, { firstName, lastName, password })
      .then(() => setDone('requested'))
      .catch(onFailure)
  }

  // The API's 400 here means a wrong password, so this one can't go through onFailure.
  const onSignIn = ({ email, password }: iAccount) => {
    start()
    AuthService.login(email, password).then(
      (res) => {
        AuthService.setLocalAuthToken(res.token)
        setIsSignedIn(true)
        return join()
      },
      (err) => {
        setSubmitting(false)
        setError(Utils.getErrorMessage(err))
      },
    )
  }

  const switchAccount = () => {
    AuthService.removeLocalAuthToken()
    setIsSignedIn(false)
    setError('')
  }

  if (linkError !== null) {
    return (
      <Result
        status='warning'
        title={<FormattedMessage id='invite-link-invalid' />}
        subTitle={linkError === '' ? <FormattedMessage id='invite-link-help' /> : linkError}
      />
    )
  }

  if (done === 'requested') {
    return (
      <Result
        status='success'
        title={<FormattedMessage id='invite-requested' />}
        subTitle={<FormattedMessage id='invite-requested-detail' values={{ email: invite?.email }} />}
        extra={
          <Button href={PASSWORD_LOGIN_URL} type='primary'>
            <FormattedMessage id='back-to-login' />
          </Button>
        }
      />
    )
  }

  if (done !== null) {
    return (
      <Result
        status={done === 'pending' ? 'info' : 'success'}
        title={<FormattedMessage id={done === 'pending' ? 'invite-waiting' : 'invite-already-member'} />}
        extra={
          <Button href={BACK_END_URL} type='primary'>
            <FormattedMessage id='dashboard' />
          </Button>
        }
      />
    )
  }

  if (invite === null) {
    return (
      <div role='status'>
        <Spin spinning />
      </div>
    )
  }

  const errorAlert =
    error === '' ? null : (
      <FormItem>
        <Alert message={intl.formatMessage({ id: 'request-not-sent' })} description={error} type='error' />
      </FormItem>
    )
  const heading = (
    <>
      <h1>
        <FormattedMessage id='invite-title' values={{ company: invite.companyName }} />
      </h1>
      <Typography.Paragraph>
        <FormattedMessage id='invite-sent-to' values={{ email: invite.email }} />
      </Typography.Paragraph>
    </>
  )

  if (isSignedIn === true) {
    return (
      <>
        {heading}
        {errorAlert}
        <Button type='primary' block loading={submitting} onClick={onJoin}>
          <FormattedMessage id='invite-join' />
        </Button>
        <Button type='link' block onClick={switchAccount}>
          <FormattedMessage id='invite-other-account' />
        </Button>
      </>
    )
  }

  const toggle = (
    <Button
      type='link'
      block
      onClick={() => {
        setHasAccount(!hasAccount)
        setError('')
      }}
    >
      <FormattedMessage id={hasAccount ? 'invite-new-account' : 'invite-have-account'} />
    </Button>
  )
  const required = (id: string) => [{ required: true, whitespace: true, message: intl.formatMessage({ id }) }]

  if (hasAccount === true) {
    const emailLabel = intl.formatMessage({ id: 'email' })
    const passwordLabel = intl.formatMessage({ id: 'password' })
    return (
      <Form layout='vertical' name='invite sign in form' onFinish={onSignIn}>
        {heading}
        {/* Not filled in from the invite: sign-in is exact-case, and an account may spell its address differently. */}
        <FormItem label={emailLabel} name='email' rules={required('email-required')}>
          <InputBox placeholder={emailLabel} prefix={<MailOutlined />} autoComplete='email' />
        </FormItem>
        <FormItem label={passwordLabel} name='password' rules={required('password-required')}>
          <InputPassword placeholder={passwordLabel} prefix={<LockOutlined />} autoComplete='current-password' />
        </FormItem>
        {errorAlert}
        <FormItem>
          <Button type='primary' htmlType='submit' block loading={submitting}>
            <FormattedMessage id='invite-sign-in' />
          </Button>
        </FormItem>
        <Button type='link' block href={FORGOT_PASSWORD_URL}>
          <FormattedMessage id='forgot-password' />
        </Button>
        {toggle}
      </Form>
    )
  }

  const firstName = intl.formatMessage({ id: 'first-name' })
  const lastName = intl.formatMessage({ id: 'last-name' })
  return (
    <Form layout='vertical' name='invite form' onFinish={onNewPerson}>
      {heading}
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
          <FormattedMessage id='invite-accept' />
        </Button>
      </FormItem>
      {toggle}
    </Form>
  )
}

export default InviteForm

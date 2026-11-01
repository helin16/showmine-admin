import React, { useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import Utils from '../../Services/Utils'
import AuthService from '../../Services/AuthService'
import { LOGIN_URL } from '../../UrlMap'
import Alert from '../Form/Alert'
import Button from '../Form/Button'
import Result from '../Form/Result'

// Waits for a click, so that a mail scanner opening the link doesn't use it up.
const ConfirmEmailForm = () => {
  // Read straight from the address and only once, as the effect below removes it.
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  // Why the link can't be used, if the API said: null means it still can.
  const [linkError, setLinkError] = useState<string | null>(token === '' ? '' : null)
  const intl = useIntl()

  // history.state stays, as the router keeps its place in it.
  useEffect(() => {
    window.history.replaceState(window.history.state, '', window.location.pathname)
  }, [])

  const confirm = () => {
    setSubmitting(true)
    setError('')
    AuthService.confirmEmail(token)
      .then(() => setDone(true))
      .catch((err) => {
        setSubmitting(false)
        if (err.response?.status === 400) {
          setLinkError(Utils.getErrorMessage(err))
          return
        }
        setError(Utils.getErrorMessage(err))
      })
  }

  const backToLogin = (
    <Button type='primary' href={LOGIN_URL}>
      <FormattedMessage id='back-to-login' />
    </Button>
  )

  if (done) {
    return <Result status='success' title={<FormattedMessage id='confirm-email-done' />} extra={backToLogin} />
  }

  if (linkError !== null) {
    return (
      <Result
        status='warning'
        title={<FormattedMessage id='confirm-email-invalid' />}
        subTitle={linkError}
        extra={backToLogin}
      />
    )
  }

  return (
    <>
      <h1>
        <FormattedMessage id='confirm-email' />
      </h1>
      <p>
        <FormattedMessage id='confirm-email-intro' />
      </p>
      {error === '' ? null : (
        <Alert message={intl.formatMessage({ id: 'request-not-sent' })} description={error} type='error' />
      )}
      <Button type='primary' block loading={submitting} onClick={confirm}>
        <FormattedMessage id='confirm' />
      </Button>
    </>
  )
}

export default ConfirmEmailForm

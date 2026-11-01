import React from 'react'
import { FormattedMessage } from 'react-intl'
import { useSelector } from 'react-redux'
import { RootState } from '../../Redux/makeReduxStore'
import { MY_PROFILE_URL } from '../../UrlMap'
import LogoutBtn from '../Auth/LogoutBtn'
import Button from '../Form/Button'
import Result from '../Form/Result'

const NoCompanyNotice = () => {
  const names = useSelector((s: RootState) => s.auth.pendingCompanies || []).map(({ name }) => name)
  return (
    <Result
      status='info'
      title={
        names.length > 0 ? (
          <FormattedMessage id='no-company-pending' values={{ names: names.join(', ') }} />
        ) : (
          <FormattedMessage id='no-company-notice' />
        )
      }
      extra={[
        <Button href={MY_PROFILE_URL} type='link' key='profile'>
          <FormattedMessage id='my-profile' />
        </Button>,
        <LogoutBtn key='logout'>
          <FormattedMessage id='sign-out' />
        </LogoutBtn>,
      ]}
    />
  )
}

export default NoCompanyNotice

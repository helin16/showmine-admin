import React from 'react'
import { FormattedMessage } from 'react-intl'
import { MY_PROFILE_URL } from '../../UrlMap'
import LogoutBtn from '../Auth/LogoutBtn'
import Button from '../Form/Button'
import Result from '../Form/Result'

const NoCompanyNotice = () => (
  <Result
    status='info'
    title={<FormattedMessage id='no-company-notice' />}
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

export default NoCompanyNotice

import React from 'react'
import translate from '../../i18n/translate'
import Result from '../../Components/Form/Result'
import Button from '../../Components/Form/Button'

const Page404 = () => (
  <Result
    status='404'
    title='404'
    subTitle={translate('pageNotExists')}
    extra={
      <Button type='primary' href='/'>
        {translate('homePage')}
      </Button>
    }
  />
)

export default Page404

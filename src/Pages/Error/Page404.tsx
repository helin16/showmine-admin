import React from 'react';
import { Result, Button } from 'antd';
import translate from '../../i18n/translate';

const Page404 =  () => (
  <Result
    status="404"
    title="404"
    subTitle={translate('pageNotExists')}
    extra={<Button type="primary" href="/">{translate('homePage')}</Button>}
  />
);

export default Page404;

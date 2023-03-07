import React from 'react';
import Result from './Form/Result';
import Icons from './Icons';

const AppInit = () => (
  <Result
    icon={<Icons.SyncOutlined spin />}
    title="Fetching your account details..."
    extra={'please be patient...'}
  />
);

export default AppInit;

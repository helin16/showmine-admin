import React from 'react'
import Result from './Form/Result'
import { SyncOutlined } from '@ant-design/icons'

const AppInit = () => (
  <Result icon={<SyncOutlined spin />} title='Fetching your account details...' extra={'please be patient...'} />
)

export default AppInit

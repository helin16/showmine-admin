import { Popconfirm as AntdPopConfirm, PopconfirmProps } from 'antd'

type iPopConfirm = PopconfirmProps
const PopConfirm = ({ className, ...props }: iPopConfirm) => {
  return <AntdPopConfirm {...props} rootClassName={`app-popconfirm ${className || ''}`} />
}

export default PopConfirm

import { Empty as AntdEmpty, EmptyProps } from 'antd'

type iEmpty = EmptyProps
const Empty = ({ className, ...props }: iEmpty) => {
  return <AntdEmpty {...props} className={`app-Empty ${className || ''}`} />
}

export default Empty

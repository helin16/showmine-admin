import { Tag as AntdTag, TagProps } from 'antd'

type iTag = TagProps
const Tag = ({ className, ...props }: iTag) => {
  return <AntdTag {...props} className={`app-Tag ${className || ''}`} />
}

export default Tag

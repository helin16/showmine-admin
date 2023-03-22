import { Space as AntdSpace, SpaceProps } from 'antd'

type iSpace = SpaceProps
const Space = ({ className, ...props }: iSpace) => {
  return <AntdSpace {...props} className={`app-Space ${className || ''}`} />
}

export default Space

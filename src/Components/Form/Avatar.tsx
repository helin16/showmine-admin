import { Avatar as AntdAvatar, AvatarProps } from 'antd'

type iAvatar = AvatarProps
const Avatar = ({ className, ...props }: iAvatar) => {
  return <AntdAvatar {...props} className={`app-Avatar ${className || ''}`} />
}

export default Avatar

import { Avatar as AntdAvatar, AvatarProps } from 'antd'

type iAvatar = AvatarProps
// antd now applies the app's large componentSize to avatars, which enlarges them.
const Avatar = ({ className, size = 'medium', ...props }: iAvatar) => {
  return <AntdAvatar {...props} size={size} className={`app-Avatar ${className || ''}`} />
}

export default Avatar

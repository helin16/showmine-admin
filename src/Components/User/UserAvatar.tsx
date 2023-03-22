import React from 'react'
import IUser from '../../Types/User/IUser'
import Icons from '../Icons'
import Avatar from '../Form/Avatar'

type iUserAvatar = {
  user?: IUser | null
  size?: number | 'small' | 'large' | 'default'
}

const UserAvatar = ({ user, size }: iUserAvatar) => {
  if (!user || user === null) {
    return <Avatar icon={<Icons.UserOutlined />} size={size} />
  }

  const avatarUrl = `${user.AvatarAsset?.url || ''}`.trim()
  if (avatarUrl !== '') {
    return <Avatar src={avatarUrl} size={size}></Avatar>
  }
  return <Avatar size={size}>{user?.nickName}</Avatar>
}

export default UserAvatar

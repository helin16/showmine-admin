import React from 'react';
import IUser from '../../Types/User/IUser';
import Icons from '../Icons';
import Avatar from '../Form/Avatar';

type iUserAvatar = {
  user?: IUser | null,
  size?: number | 'small' | 'large' | 'default',
}

const UserAvatar = ({ user, size }: iUserAvatar) => {
  if (!user || user === null) {
    return (
      <Avatar icon={<Icons.UserOutlined />} size={size}/>
    );
  }

  if (user.avatar_img !== '') {
    return (
      <Avatar src={user.avatar_img} size={size}></Avatar>
    );
  }
  return (
    <Avatar size={size}>
      {
        user?.nick_name // eslint-disable-line
      }
    </Avatar>
  );
};

export default UserAvatar;

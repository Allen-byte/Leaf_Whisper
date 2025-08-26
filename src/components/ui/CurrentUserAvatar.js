import React from 'react';
import { Avatar } from './Avatar';
import { useUser } from '../../contexts/UserContext';

/**
 * 当前用户头像组件
 * 自动从UserContext获取当前用户信息并显示头像
 */
export const CurrentUserAvatar = ({ size = 40, style, ...props }) => {
  const { user } = useUser();

  return (
    <Avatar
      size={size}
      name={user?.name || '匿名用户'}
      uri={user?.avatar}
      style={style}
      {...props}
    />
  );
};

export default CurrentUserAvatar;
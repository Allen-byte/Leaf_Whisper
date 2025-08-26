import { useUser } from '../contexts/UserContext';

/**
 * 获取当前用户信息的Hook
 * 提供便捷的用户信息访问方法
 */
export const useCurrentUser = () => {
  const { user, isLoggedIn, isLoading, updateUser, logout, refreshUser } = useUser();

  // 获取用户显示名称
  const getDisplayName = () => {
    return user?.name || '匿名用户';
  };

  // 获取用户头像
  const getAvatar = () => {
    return user?.avatar || '';
  };

  // 获取用户简介
  const getBio = () => {
    return user?.bio || '';
  };

  // 获取用户ID
  const getUserId = () => {
    return user?.id;
  };

  // 获取用户名
  const getUsername = () => {
    return user?.username || '';
  };

  // 检查是否是当前用户
  const isCurrentUser = (userId) => {
    return user?.id === userId;
  };

  // 获取用户加入时间
  const getJoinDate = () => {
    if (!user?.createdAt) return '2024年1月';
    return new Date(user.createdAt).toLocaleDateString('zh-CN');
  };

  return {
    // 原始用户对象
    user,
    
    // 状态
    isLoggedIn,
    isLoading,
    
    // 便捷方法
    getDisplayName,
    getAvatar,
    getBio,
    getUserId,
    getUsername,
    getJoinDate,
    isCurrentUser,
    
    // 操作方法
    updateUser,
    logout,
    refreshUser,
  };
};

export default useCurrentUser;
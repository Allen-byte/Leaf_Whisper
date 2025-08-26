import ApiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 基础API函数
export const getAllPosts = (page = 1, limit = 20) => ApiService.request(`/posts?page=${page}&limit=${limit}`);
export const createPost = (data) => ApiService.request('/posts', {
  method: 'POST',
  body: JSON.stringify(data),
  headers: { 'Content-Type': 'application/json' }
});


export const getUserPosts = (userId) => ApiService.request(`/users/${userId}/posts`);
export const getUsersStats = (userId) => ApiService.request(`/users/${userId}/stats`);
export const getUser = (userId) => ApiService.request(`/users/${userId}`);
export const updateUser = (userId, data) => ApiService.request(`/users/${userId}`, {
  method: 'PUT',
  body: JSON.stringify(data),
  headers: { 'Content-Type': 'application/json' }
});

// 上传头像
export const uploadAvatar = async (imageUri) => {
  try {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    });

    const response = await ApiService.request('/users/avatar', {
      method: 'POST',
      body: formData,
    });

    return response;
  } catch (error) {
    console.error('头像上传失败:', error);
    throw error;
  }
};

// 上传背景图
export const uploadBackground = async (imageUri) => {
  try {
    const formData = new FormData();
    formData.append('background', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'background.jpg',
    });

    const response = await ApiService.request('/users/background', {
      method: 'POST',
      body: formData,
    });

    return response;
  } catch (error) {
    console.error('背景图上传失败:', error);
    throw error;
  }
};

// 更新用户资料
export const updateUserProfile = async (userData) => {
  try {
    const response = await ApiService.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('更新用户资料失败:', error);
    throw error;
  }
};

// 获取我的帖子
export const getMyPosts = () => ApiService.request('/posts/my-posts');

// 上传帖子图片
export const uploadPostImages = async (imageUris) => {
  try {
    const formData = new FormData();

    // 添加多张图片到FormData
    imageUris.forEach((uri, index) => {
      formData.append('images', {
        uri: uri,
        type: 'image/jpeg',
        name: `image_${index}.jpg`,
      });
    });

    const response = await ApiService.request('/posts/upload-images', {
      method: 'POST',
      body: formData,
    });

    return response;
  } catch (error) {
    console.error('帖子图片上传失败:', error);
    throw error;
  }
};

// 获取用户洞察数据
export const getUserInsights = async () => {
  try {
    const response = await ApiService.request('/users/insights');
    return response.data;
  } catch (error) {
    console.error('获取用户洞察数据失败:', error);
    throw error;
  }
};

// 获取每日任务
export const getDailyTask = async () => {
  try {
    const response = await ApiService.request('/users/daily-task');
    return response.data;
  } catch (error) {
    console.error('获取每日任务失败:', error);
    // 返回默认任务数据
    return {
      warmMessage: "今天也要保持好心情哦 ✨",
      task: "写下一件让你开心的小事 📝"
    };
  }
};

// 获取用户评论
export const getUserComments = async () => {
  try {
    const response = await ApiService.request('/users/comments');
    return response;
  } catch (error) {
    console.error('获取用户评论失败:', error);
    throw error;
  }
};

// 评论相关API
export const getPostComments = (postId, page = 1, limit = 20) =>
  ApiService.request(`/posts/${postId}/comments?page=${page}&limit=${limit}`);

export const createComment = (postId, content) => ApiService.request(`/posts/${postId}/comments`, {
  method: 'POST',
  body: JSON.stringify({ content }),
  headers: { 'Content-Type': 'application/json' }
});

export const getPostForEdit = async (postId) => {
  try {
    const response = await ApiService.request(`/posts/${postId}/edit`, {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    throw error;
  }
};

// 更新帖子
export const updatePost = async (postId, postData) => {
  try {
    const response = await ApiService.request(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
      headers: { 'Content-Type': 'application/json' } // 添加这行
    });
    return response;
  } catch (error) {
    console.error('更新帖子失败:', error);
    throw error;
  }
};

// 删除帖子
export const deletePost = async (postId) => {
  try {
    const response = await ApiService.request(`/posts/${postId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('删除帖子失败:', error);
    throw error;
  }
};

//删除评论
export const deleteComment = async (postId, commentId) => {
  try {
    const response = await ApiService.request(`/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('删除评论失败:', error);
    throw error;
  }
};

//根据postId获取评论数量
export const getPostCommentsCount = async (postId) => {
  try {
    const response = await ApiService.request(`/posts/${postId}/commentsCount`);
    return response.data;
  } catch (error) {
    console.error('获取评论数量失败:', error);
    throw error;
  }
};

//获取标签
export const fetchTags = async (content, options = {}) => {
  try {
    const response = await ApiService.request(`/tags/fetchTags`, {
      method: "POST",
      body: JSON.stringify({ content }),
      headers: { 'Content-Type': 'application/json' },
      signal: options.signal, // 支持 AbortController
    });
    return response;
  } catch (error) {
    console.error("获取标签失败: ", error);
    throw error;
  }
}

// 搜索用户
export const searchUsers = async (query) => {
  try {
    const response = await ApiService.request(`/users/search?query=${encodeURIComponent(query)}`);
    return response;
  } catch (error) {
    console.error('搜索用户失败:', error);
    throw error;
  }
};

// 获取用户公开资料
export const getUserProfile = async (userId) => {
  try {
    const response = await ApiService.request(`/users/${userId}/public-profile`);
    return response;
  } catch (error) {
    console.error('获取用户资料失败:', error);
    throw error;
  }
};

// 获取用户公开帖子
export const getUserPublicPosts = async (userId) => {
  try {
    const response = await ApiService.request(`/users/${userId}/public-posts`);
    return response;
  } catch (error) {
    console.error('获取用户帖子失败:', error);
    throw error;
  }
};

//根据帖子id获取对应内容
export const getPostById = async (postId) => {
  try {
    const response = await ApiService.request(`/posts/${postId}`);
    return response;
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    throw error;
  }
};

// 获取消息通知列表
export const getNotifications = async (page = 1, limit = 20) => {
  try {
    const response = await ApiService.request(`/notifications?page=${page}&limit=${limit}`);
    return response;
  } catch (error) {
    console.error('获取消息通知失败:', error);
    throw error;
  }
};

// 获取未读消息数量
export const getUnreadNotificationCount = async () => {
  try {
    return await ApiService.request('/notifications/unread-count');
  } catch (error) {
    console.error('获取未读消息数量失败:', error);
    throw error;
  }
};

// 标记消息为已读
export const markNotificationAsRead = async (notificationId) => {
  try {
    return await ApiService.request(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  } catch (error) {
    console.error('标记消息已读失败:', error);
    throw error;
  }
};

// 删除消息
export const deleteNotification = async (notificationId) => {
  try {
    return await ApiService.request(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('删除消息失败:', error);
    throw error;
  }
};

// 标记所有消息为已读
export const markAllNotificationsAsRead = async () => {
  try {
    return await ApiService.request('/notifications/read-all', {
      method: 'PUT'
    });
  } catch (error) {
    console.error('标记所有消息已读失败:', error);
    throw error;
  }
};

export const createMark = async (postId) => {
  try{
    console.log("准备发送请求，请求路径: ", `/posts/mark/${postId}`);
    const response = await ApiService.request(`/posts/mark/${postId}`, {
      method: 'POST'
    });
    return response;
  }catch(error){
    console.error('创建mark失败:', error);
    throw error;
  }
};

// 获取用户的mark列表
export const getUserMarks = async (page = 1, limit = 20) => {
  try {
    const response = await ApiService.request(`/users/marks?page=${page}&limit=${limit}`);
    return response;
  } catch (error) {
    console.error('获取用户mark列表失败:', error);
    throw error;
  }
};

// 取消mark
export const removeMark = async (postId) => {
  try {
    const response = await ApiService.request(`/posts/mark/${postId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('取消mark失败:', error);
    throw error;
  }
};

// 检查帖子是否已被mark
export const checkMarkStatus = async (postId) => {
  try {
    const response = await ApiService.request(`/posts/mark/${postId}/status`);
    return response;
  } catch (error) {
    console.error('检查mark状态失败:', error);
    throw error;
  }
};




// 保留类定义作为备用（如果需要的话）
class OnlineOnlyStorage {
  static getAllPosts = getAllPosts;
  static createPost = createPost;
  static getUserPosts = getUserPosts;
  static getMyPosts = getMyPosts;
  static getUsersStats = getUsersStats;
  static getUser = getUser;
  static updateUser = updateUser;
  static getPostForEdit = getPostForEdit;
  static deletePost = deletePost;
  static updatePost = updatePost;
  static deleteComment = deleteComment;
  static getUserPublicPosts = getUserPublicPosts;
}

export default OnlineOnlyStorage;
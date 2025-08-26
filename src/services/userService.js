import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './api';

const USER_STORAGE_KEY = 'currentUser';

class UserService {
  // 保存用户信息到本地存储
  static async saveUserInfo(userInfo) {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userInfo));
      console.log('用户信息已保存到本地');
    } catch (error) {
      console.error('保存用户信息失败:', error);
      throw error;
    }
  }

  // 从本地存储获取用户信息
  static async getCurrentUser() {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('获取本地用户信息失败:', error);
      return null;
    }
  }

  // 清除本地用户信息
  static async clearUserInfo() {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      console.log('本地用户信息已清除');
    } catch (error) {
      console.error('清除用户信息失败:', error);
      throw error;
    }
  }

  // 登录并保存用户信息
  static async login(username, password) {
    try {
      const response = await ApiService.login(username, password);
      
      if (response.success && response.user) {
        // 获取完整的用户信息（包括帖子数、评论数等）
        const fullUserInfo = await ApiService.getProfile();
        if (fullUserInfo.success) {
          await this.saveUserInfo(fullUserInfo.user);
        } else {
          // 如果获取完整信息失败，至少保存基本信息
          await this.saveUserInfo(response.user);
        }
      }
      
      return response;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  // 注册并保存用户信息
  static async register(userData) {
    try {
      const response = await ApiService.register(userData);
      
      if (response.success && response.user) {
        // 获取完整的用户信息
        const fullUserInfo = await ApiService.getProfile();
        if (fullUserInfo.success) {
          await this.saveUserInfo(fullUserInfo.user);
        } else {
          await this.saveUserInfo(response.user);
        }
      }
      
      return response;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  }

  // 退出登录
  static async logout() {
    try {
      await ApiService.logout();
      await this.clearUserInfo();
      console.log('用户已退出登录');
    } catch (error) {
      console.error('退出登录失败:', error);
      throw error;
    }
  }

  // 更新用户信息（同时更新本地和服务器）
  static async updateUserInfo(userData) {
    try {
      // 先更新服务器
      const response = await ApiService.request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(userData),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.success) {
        // 更新本地存储
        const currentUser = await this.getCurrentUser();
        const updatedUser = { ...currentUser, ...response.user };
        await this.saveUserInfo(updatedUser);
        return updatedUser;
      }
      
      return response;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }

  // 检查用户是否已登录
  static async isLoggedIn() {
    try {
      const token = await ApiService.getToken();
      const user = await this.getCurrentUser();
      return !!(token && user);
    } catch (error) {
      return false;
    }
  }

  // 刷新用户信息（从服务器获取最新信息）
  static async refreshUserInfo() {
    try {
      const response = await ApiService.getProfile();
      if (response.success) {
        await this.saveUserInfo(response.user);
        return response.user;
      }
      throw new Error('获取用户信息失败');
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      throw error;
    }
  }

  // 关注用户
  static async followUser(userId) {
    try {
      const response = await ApiService.request(`/users/${userId}/follow`, {
        method: 'POST'
      });
      
      if (response.success) {
        // 刷新当前用户信息以更新关注数量
        await this.refreshUserInfo();
      }
      
      return response;
    } catch (error) {
      console.error('关注用户失败:', error);
      throw error;
    }
  }

  // 取消关注用户
  static async unfollowUser(userId) {
    try {
      const response = await ApiService.request(`/users/${userId}/follow`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // 刷新当前用户信息以更新关注数量
        await this.refreshUserInfo();
      }
      
      return response;
    } catch (error) {
      console.error('取消关注失败:', error);
      throw error;
    }
  }

  // 检查是否关注某个用户
  static async checkFollowStatus(userId) {
    try {
      const response = await ApiService.request(`/users/${userId}/follow-status`);
      return response;
    } catch (error) {
      console.error('检查关注状态失败:', error);
      throw error;
    }
  }

  // 获取用户的关注列表
  static async getFollowing(userId, page = 1, limit = 20) {
    try {
      const response = await ApiService.request(`/users/${userId}/following?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('获取关注列表失败:', error);
      throw error;
    }
  }

  // 获取用户的粉丝列表
  static async getFollowers(userId, page = 1, limit = 20) {
    try {
      const response = await ApiService.request(`/users/${userId}/followers?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('获取粉丝列表失败:', error);
      throw error;
    }
  }

  // 获取用户的关注统计信息
  static async getFollowStats(userId) {
    try {
      const response = await ApiService.request(`/users/${userId}/follow-stats`);
      return response;
    } catch (error) {
      console.error('获取关注统计失败:', error);
      throw error;
    }
  }

  // 获取当前用户的关注列表（便捷方法）
  static async getMyFollowing(page = 1, limit = 20) {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('用户未登录');
      }
      return await this.getFollowing(currentUser.id, page, limit);
    } catch (error) {
      console.error('获取我的关注列表失败:', error);
      throw error;
    }
  }

  // 获取当前用户的粉丝列表（便捷方法）
  static async getMyFollowers(page = 1, limit = 20) {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('用户未登录');
      }
      return await this.getFollowers(currentUser.id, page, limit);
    } catch (error) {
      console.error('获取我的粉丝列表失败:', error);
      throw error;
    }
  }
}

export default UserService;
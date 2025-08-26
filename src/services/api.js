const SERVER_IP = "x.x.x.x";

const API_BASE_URL = __DEV__
  ? `http://${SERVER_IP}:3000/api`
  : 'http://${SERVER_IP}:3000/api';

class ApiService {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {},
      ...options,
    };

    // 只有当 body 不是 FormData 时才设置 Content-Type
    if (!(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    // 合并其他 headers
    if (options.headers) {
      config.headers = { ...config.headers, ...options.headers };
    }

    // 添加认证令牌
    const token = await this.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // 检查响应的内容类型
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // 如果不是JSON响应，尝试获取文本内容
        const text = await response.text();
        console.warn('收到非JSON响应:', text);
        data = { error: text || '服务器返回了无效的响应格式' };
      }

      if (!response.ok) {
        throw new Error(data.error || '请求失败');
      }

      return data;
    } catch (error) {
      console.error('API请求错误:', error);
      // 如果是JSON解析错误，提供更友好的错误信息
      if (error.message.includes('JSON Parse error') || error.message.includes('Unexpected character')) {
        throw new Error('服务器响应格式错误，请稍后重试');
      }
      throw error;
    }
  }

  static async getToken() {
    // 从AsyncStorage获取token
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  }

  static async setToken(token) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('保存token失败:', error);
    }
  }

  static async removeToken() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('删除token失败:', error);
    }
  }

  // 认证相关API
  static async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (data.success && data.token) {
      await this.setToken(data.token);
    }

    return data;
  }

  static async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (data.success && data.token) {
      await this.setToken(data.token);
    }

    return data;
  }

  static async getProfile() {
    return await this.request('/auth/profile');
  }

  static async logout() {
    await this.removeToken();
  }
}

export default ApiService;

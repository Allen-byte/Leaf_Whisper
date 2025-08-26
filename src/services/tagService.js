import ApiService from './api';

/**
 * 标签相关API服务
 * 提供标签搜索、获取热门标签等功能
 */
class TagService {
  /**
   * 搜索标签建议
   * @param {string} query - 搜索关键词
   * @param {number} limit - 返回结果数量限制，默认10个
   * @returns {Promise<Array>} 标签建议列表
   */
  static async searchTags(query, limit = 10) {
    try {
      const response = await ApiService.request(`/tags/search`, {
        method: 'GET',
        params: {
          q: query,
          limit: limit
        }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('搜索标签失败:', error);
      throw error;
    }
  }

  /**
   * 获取热门标签
   * @param {number} limit - 返回结果数量限制，默认20个
   * @returns {Promise<Array>} 热门标签列表
   */
  static async getPopularTags(limit = 20) {
    try {
      // TODO: 实现真实的API调用
      const response = await ApiService.request(`/tags/popular`, {
        method: 'GET',
        params: {
          limit: limit
        }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('获取热门标签失败:', error);
      throw error;
    }
  }

  /**
   * 创建新标签
   * @param {string} tagName - 标签名称
   * @returns {Promise<Object>} 创建结果
   */
  static async createTag(tagName) {
    try {
      // TODO: 实现真实的API调用
      const response = await ApiService.request('/tags', {
        method: 'POST',
        body: JSON.stringify({
          name: tagName
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response;
    } catch (error) {
      console.error('创建标签失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户使用过的标签
   * @returns {Promise<Array>} 用户标签历史
   */
  static async getUserTags() {
    try {
      // TODO: 实现真实的API调用
      const response = await ApiService.request('/users/tags', {
        method: 'GET'
      });
      
      return response.data || [];
    } catch (error) {
      console.error('获取用户标签失败:', error);
      throw error;
    }
  }

  /**
   * 模拟标签搜索（开发阶段使用）
   * @param {string} query - 搜索关键词
   * @param {Array} mockData - 模拟数据
   * @param {number} limit - 返回结果数量限制
   * @returns {Promise<Array>} 过滤后的标签列表
   */
  static async mockSearchTags(query, mockData, limit = 8) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!query || query.trim() === '') {
      // 如果没有查询词，返回热门标签
      return mockData.slice(0, limit);
    }
    
    // 过滤匹配的标签
    const filtered = mockData.filter(tag => 
      tag.name.toLowerCase().includes(query.toLowerCase())
    );
    
    // 按引用量排序并限制数量
    return filtered
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

export default TagService;
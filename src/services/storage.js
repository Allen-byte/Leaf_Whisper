import AsyncStorage from '@react-native-async-storage/async-storage';

// 使用AsyncStorage作为临时数据存储方案
// 这是一个简单的JSON存储，适合开发和测试

const STORAGE_KEYS = {
  POSTS: 'posts',
  USER: 'user',
  LIKES: 'likes',
  BOOKMARKS: 'bookmarks',
  TAGS: 'tags'
};

// 初始化存储
export const initStorage = async () => {
  try {
    // 检查是否已初始化
    const isInitialized = await AsyncStorage.getItem('initialized');
    if (isInitialized) return;

    // 初始化默认数据
    const defaultUser = {
      id: 1,
      name: '我',
      bio: '愿你被这个世界温柔以待 ✨',
      joinDate: '2024年1月',
      avatar: ''
    };

    const defaultTags = [
      '生活感悟', '学习', '工作', '情感', '随想', '分享', 
      '求助', '吐槽', '治愈', '励志', '日常', '心情'
    ];

    const defaultPosts = [
      {
        id: '1',
        userId: 1,
        content: '欢迎来到树洞！这里是一个温暖的分享社区，你可以匿名分享心情、感悟和生活点滴。',
        mood: '开心',
        tags: ['分享', '治愈'],
        images: [{ id: 'img1', uri: 'https://picsum.photos/300/200?random=100' }],
        isAnonymous: false,
        createdAt: Date.now() - 1000 * 60 * 60 * 2,
        likes: 5,
        comments: []
      },
      {
        id: '2',
        userId: 1,
        content: '今天学到了很多新知识，感觉很充实。分享学习心得：保持好奇心，持续学习，每天进步一点点。',
        mood: '思考',
        tags: ['学习', '励志'],
        images: [],
        isAnonymous: false,
        createdAt: Date.now() - 1000 * 60 * 60 * 24,
        likes: 12,
        comments: []
      }
    ];

    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
    await AsyncStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(defaultTags));
    await AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(defaultPosts));
    await AsyncStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify([]));
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify([]));
    await AsyncStorage.setItem('initialized', 'true');

    console.log('存储初始化完成');
  } catch (error) {
    console.error('存储初始化失败:', error);
    throw error;
  }
};

// 创建帖子
export const createPost = async (postData) => {
  try {
    const posts = await getAllPosts();
    const newPost = {
      id: Date.now().toString(),
      userId: 1,
      content: postData.content,
      mood: postData.mood || null,
      tags: postData.tags || [],
      images: postData.images || [],
      isAnonymous: postData.isAnonymous || false,
      createdAt: Date.now(),
      likes: 0,
      comments: []
    };

    const updatedPosts = [newPost, ...posts];
    await AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updatedPosts));
    return newPost.id;
  } catch (error) {
    console.error('创建帖子失败:', error);
    throw error;
  }
};

// 获取所有帖子
export const getAllPosts = async () => {
  try {
    const postsJson = await AsyncStorage.getItem(STORAGE_KEYS.POSTS);
    const posts = postsJson ? JSON.parse(postsJson) : [];
    const likes = await getLikes();
    const bookmarks = await getBookmarks();
    const user = await getUser();

    return posts.map(post => ({
      id: post.id,
      author: {
        id: post.userId?.toString() || 'unknown',
        name: post.isAnonymous ? '匿名用户' : (user?.name || '匿名用户'),
        avatar: post.isAnonymous ? '' : (user?.avatar || '')
      },
      content: post.content,
      mood: post.mood,
      tags: post.tags || [],
      images: post.images || [],
      liked: likes.includes(post.id),
      likes: post.likes || 0,
      bookmarked: bookmarks.includes(post.id),
      comments: post.comments || [],
      createdAt: post.createdAt,
      isAnonymous: post.isAnonymous
    }));
  } catch (error) {
    console.error('获取帖子失败:', error);
    return [];
  }
};

// 获取点赞列表
const getLikes = async () => {
  try {
    const likesJson = await AsyncStorage.getItem(STORAGE_KEYS.LIKES);
    return likesJson ? JSON.parse(likesJson) : [];
  } catch (error) {
    return [];
  }
};

// 获取收藏列表
const getBookmarks = async () => {
  try {
    const bookmarksJson = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return bookmarksJson ? JSON.parse(bookmarksJson) : [];
  } catch (error) {
    return [];
  }
};

// 切换点赞状态
export const toggleLike = async (postId) => {
  try {
    const likes = await getLikes();
    const posts = await AsyncStorage.getItem(STORAGE_KEYS.POSTS);
    const postsData = posts ? JSON.parse(posts) : [];

    let isLiked;
    if (likes.includes(postId)) {
      // 取消点赞
      const newLikes = likes.filter(id => id !== postId);
      await AsyncStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(newLikes));
      
      // 减少点赞数
      const updatedPosts = postsData.map(post => 
        post.id === postId ? { ...post, likes: Math.max(0, (post.likes || 0) - 1) } : post
      );
      await AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updatedPosts));
      isLiked = false;
    } else {
      // 添加点赞
      const newLikes = [...likes, postId];
      await AsyncStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(newLikes));
      
      // 增加点赞数
      const updatedPosts = postsData.map(post => 
        post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
      );
      await AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updatedPosts));
      isLiked = true;
    }

    return isLiked;
  } catch (error) {
    console.error('切换点赞失败:', error);
    throw error;
  }
};

// 切换收藏状态
export const toggleBookmark = async (postId) => {
  try {
    const bookmarks = await getBookmarks();
    let isBookmarked;

    if (bookmarks.includes(postId)) {
      // 取消收藏
      const newBookmarks = bookmarks.filter(id => id !== postId);
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(newBookmarks));
      isBookmarked = false;
    } else {
      // 添加收藏
      const newBookmarks = [...bookmarks, postId];
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(newBookmarks));
      isBookmarked = true;
    }

    return isBookmarked;
  } catch (error) {
    console.error('切换收藏失败:', error);
    throw error;
  }
};

// 获取用户的帖子
export const getUserPosts = async (userId = 1) => {
  try {
    const allPosts = await getAllPosts();
    return allPosts.filter(post => post.author.id === userId.toString()).map(post => ({
      ...post,
      views: Math.floor(Math.random() * 100),
      status: 'published'
    }));
  } catch (error) {
    console.error('获取用户帖子失败:', error);
    return [];
  }
};

// 获取用户点赞的帖子
export const getUserLikedPosts = async () => {
  try {
    const likes = await getLikes();
    const allPosts = await getAllPosts();
    return allPosts.filter(post => likes.includes(post.id)).map(post => ({
      ...post,
      likedAt: Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7 // 模拟点赞时间
    }));
  } catch (error) {
    console.error('获取点赞帖子失败:', error);
    return [];
  }
};

// 获取用户收藏的帖子
export const getUserBookmarkedPosts = async () => {
  try {
    const bookmarks = await getBookmarks();
    const allPosts = await getAllPosts();
    return allPosts.filter(post => bookmarks.includes(post.id)).map(post => ({
      ...post,
      bookmarkedAt: Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7 // 模拟收藏时间
    }));
  } catch (error) {
    console.error('获取收藏帖子失败:', error);
    return [];
  }
};

// 更新用户信息
export const updateUser = async (userId = 1, userData) => {
  try {
    const user = await getUser();
    const updatedUser = { ...user, ...userData };
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    return updatedUser;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
};

// 获取用户信息
export const getUser = async (userId = 1) => {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};
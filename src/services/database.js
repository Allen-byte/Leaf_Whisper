import * as SQLite from 'expo-sqlite';

// 打开数据库
const db = SQLite.openDatabase('treehole.db');

// 初始化数据库表
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // 用户表
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          bio TEXT,
          avatar TEXT,
          join_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // 帖子表
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          content TEXT NOT NULL,
          mood TEXT,
          is_anonymous BOOLEAN DEFAULT 0,
          likes_count INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );`
      );

      // 标签表
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL
        );`
      );

      // 帖子标签关联表
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS post_tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER,
          tag_id INTEGER,
          FOREIGN KEY (post_id) REFERENCES posts (id),
          FOREIGN KEY (tag_id) REFERENCES tags (id)
        );`
      );

      // 图片表
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER,
          uri TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts (id)
        );`
      );

      // 评论表
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER,
          author_name TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts (id)
        );`
      );

      // 点赞表
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER,
          user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(post_id, user_id)
        );`
      );

      // 收藏表
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS bookmarks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER,
          user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(post_id, user_id)
        );`
      );

      // 插入默认用户
      tx.executeSql(
        `INSERT OR IGNORE INTO users (id, name, bio, join_date) VALUES (1, '我', '愿你被这个世界温柔以待 ✨', '2024年1月');`
      );

      // 插入默认标签
      const defaultTags = ['生活感悟', '学习', '工作', '情感', '随想', '分享', '求助', '吐槽', '治愈', '励志', '日常', '心情'];
      defaultTags.forEach(tag => {
        tx.executeSql(
          `INSERT OR IGNORE INTO tags (name) VALUES (?);`,
          [tag]
        );
      });

      // 插入示例帖子（仅在首次初始化时）
      tx.executeSql(
        `SELECT COUNT(*) as count FROM posts;`,
        [],
        (_, { rows }) => {
          if (rows._array[0].count === 0) {
            // 插入示例帖子1
            tx.executeSql(
              `INSERT INTO posts (user_id, content, mood, is_anonymous) VALUES (?, ?, ?, ?);`,
              [1, '欢迎来到树洞！这里是一个温暖的分享社区，你可以匿名分享心情、感悟和生活点滴。', '开心', 0],
              (_, result) => {
                const postId = result.insertId;
                // 添加标签
                tx.executeSql(`INSERT INTO post_tags (post_id, tag_id) SELECT ?, id FROM tags WHERE name = ?;`, [postId, '分享']);
                tx.executeSql(`INSERT INTO post_tags (post_id, tag_id) SELECT ?, id FROM tags WHERE name = ?;`, [postId, '治愈']);
                // 添加示例图片
                tx.executeSql(`INSERT INTO images (post_id, uri) VALUES (?, ?);`, [postId, 'https://picsum.photos/300/200?random=100']);
              }
            );

            // 插入示例帖子2
            tx.executeSql(
              `INSERT INTO posts (user_id, content, mood, is_anonymous) VALUES (?, ?, ?, ?);`,
              [1, '今天学到了很多新知识，感觉很充实。分享学习心得：保持好奇心，持续学习，每天进步一点点。', '思考', 0],
              (_, result) => {
                const postId = result.insertId;
                tx.executeSql(`INSERT INTO post_tags (post_id, tag_id) SELECT ?, id FROM tags WHERE name = ?;`, [postId, '学习']);
                tx.executeSql(`INSERT INTO post_tags (post_id, tag_id) SELECT ?, id FROM tags WHERE name = ?;`, [postId, '励志']);
              }
            );
          }
        }
      );

    }, reject, resolve);
  });
};

// 创建帖子
export const createPost = (postData) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // 插入帖子
      tx.executeSql(
        `INSERT INTO posts (user_id, content, mood, is_anonymous) VALUES (?, ?, ?, ?);`,
        [1, postData.content, postData.mood || null, postData.isAnonymous ? 1 : 0],
        (_, result) => {
          const postId = result.insertId;

          // 插入标签关联
          if (postData.tags && postData.tags.length > 0) {
            postData.tags.forEach(tagName => {
              tx.executeSql(
                `INSERT INTO post_tags (post_id, tag_id) 
                 SELECT ?, id FROM tags WHERE name = ?;`,
                [postId, tagName]
              );
            });
          }

          // 插入图片
          if (postData.images && postData.images.length > 0) {
            postData.images.forEach(image => {
              tx.executeSql(
                `INSERT INTO images (post_id, uri) VALUES (?, ?);`,
                [postId, image.uri]
              );
            });
          }

          resolve(postId);
        },
        (_, error) => reject(error)
      );
    });
  });
};

// 获取所有帖子
export const getAllPosts = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT 
          p.*,
          u.name as author_name,
          u.avatar as author_avatar,
          GROUP_CONCAT(DISTINCT t.name) as tags,
          GROUP_CONCAT(DISTINCT i.uri) as image_uris,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = 1) as is_liked,
          (SELECT COUNT(*) FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = 1) as is_bookmarked
         FROM posts p
         LEFT JOIN users u ON p.user_id = u.id
         LEFT JOIN post_tags pt ON p.id = pt.post_id
         LEFT JOIN tags t ON pt.tag_id = t.id
         LEFT JOIN images i ON p.id = i.post_id
         GROUP BY p.id
         ORDER BY p.created_at DESC;`,
        [],
        (_, { rows }) => {
          const posts = rows._array.map(row => ({
            id: row.id.toString(),
            author: {
              id: row.user_id?.toString() || 'unknown',
              name: row.is_anonymous ? '匿名用户' : (row.author_name || '匿名用户'),
              avatar: row.is_anonymous ? '' : (row.author_avatar || '')
            },
            content: row.content,
            mood: row.mood,
            tags: row.tags ? row.tags.split(',') : [],
            images: row.image_uris ? row.image_uris.split(',').map((uri, index) => ({
              id: `img_${row.id}_${index}`,
              uri
            })) : [],
            liked: row.is_liked > 0,
            likes: row.likes_count || 0,
            bookmarked: row.is_bookmarked > 0,
            comments: [], // 评论需要单独查询
            createdAt: new Date(row.created_at).getTime(),
            isAnonymous: row.is_anonymous === 1
          }));
          resolve(posts);
        },
        (_, error) => reject(error)
      );
    });
  });
};

// 切换点赞状态
export const toggleLike = (postId, userId = 1) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // 检查是否已点赞
      tx.executeSql(
        `SELECT id FROM likes WHERE post_id = ? AND user_id = ?;`,
        [postId, userId],
        (_, { rows }) => {
          if (rows.length > 0) {
            // 取消点赞
            tx.executeSql(
              `DELETE FROM likes WHERE post_id = ? AND user_id = ?;`,
              [postId, userId],
              () => resolve(false),
              (_, error) => reject(error)
            );
          } else {
            // 添加点赞
            tx.executeSql(
              `INSERT INTO likes (post_id, user_id) VALUES (?, ?);`,
              [postId, userId],
              () => resolve(true),
              (_, error) => reject(error)
            );
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};

// 切换收藏状态
export const toggleBookmark = (postId, userId = 1) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // 检查是否已收藏
      tx.executeSql(
        `SELECT id FROM bookmarks WHERE post_id = ? AND user_id = ?;`,
        [postId, userId],
        (_, { rows }) => {
          if (rows.length > 0) {
            // 取消收藏
            tx.executeSql(
              `DELETE FROM bookmarks WHERE post_id = ? AND user_id = ?;`,
              [postId, userId],
              () => resolve(false),
              (_, error) => reject(error)
            );
          } else {
            // 添加收藏
            tx.executeSql(
              `INSERT INTO bookmarks (post_id, user_id) VALUES (?, ?);`,
              [postId, userId],
              () => resolve(true),
              (_, error) => reject(error)
            );
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};

// 获取用户的帖子
export const getUserPosts = (userId = 1) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT 
          p.*,
          u.name as author_name,
          u.avatar as author_avatar,
          GROUP_CONCAT(DISTINCT t.name) as tags,
          GROUP_CONCAT(DISTINCT i.uri) as image_uris,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
         FROM posts p
         LEFT JOIN users u ON p.user_id = u.id
         LEFT JOIN post_tags pt ON p.id = pt.post_id
         LEFT JOIN tags t ON pt.tag_id = t.id
         LEFT JOIN images i ON p.id = i.post_id
         WHERE p.user_id = ?
         GROUP BY p.id
         ORDER BY p.created_at DESC;`,
        [userId],
        (_, { rows }) => {
          const posts = rows._array.map(row => ({
            id: row.id.toString(),
            author: {
              id: row.user_id?.toString() || 'unknown',
              name: row.is_anonymous ? '匿名用户' : (row.author_name || '匿名用户'),
              avatar: row.is_anonymous ? '' : (row.author_avatar || '')
            },
            content: row.content,
            mood: row.mood,
            tags: row.tags ? row.tags.split(',') : [],
            images: row.image_uris ? row.image_uris.split(',').map((uri, index) => ({
              id: `img_${row.id}_${index}`,
              uri
            })) : [],
            likes: row.likes_count || 0,
            comments: [],
            views: Math.floor(Math.random() * 100), // 模拟浏览数
            status: 'published',
            createdAt: new Date(row.created_at).getTime(),
            isAnonymous: row.is_anonymous === 1
          }));
          resolve(posts);
        },
        (_, error) => reject(error)
      );
    });
  });
};

// 获取用户点赞的帖子
export const getUserLikedPosts = (userId = 1) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT 
          p.*,
          u.name as author_name,
          u.avatar as author_avatar,
          GROUP_CONCAT(DISTINCT t.name) as tags,
          GROUP_CONCAT(DISTINCT i.uri) as image_uris,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
          l.created_at as liked_at
         FROM posts p
         LEFT JOIN users u ON p.user_id = u.id
         LEFT JOIN post_tags pt ON p.id = pt.post_id
         LEFT JOIN tags t ON pt.tag_id = t.id
         LEFT JOIN images i ON p.id = i.post_id
         INNER JOIN likes l ON p.id = l.post_id
         WHERE l.user_id = ?
         GROUP BY p.id
         ORDER BY l.created_at DESC;`,
        [userId],
        (_, { rows }) => {
          const posts = rows._array.map(row => ({
            id: row.id.toString(),
            author: {
              id: row.user_id?.toString() || 'unknown',
              name: row.is_anonymous ? '匿名用户' : (row.author_name || '匿名用户'),
              avatar: row.is_anonymous ? '' : (row.author_avatar || '')
            },
            content: row.content,
            likes: row.likes_count || 0,
            comments: [],
            createdAt: new Date(row.created_at).getTime(),
            likedAt: new Date(row.liked_at).getTime()
          }));
          resolve(posts);
        },
        (_, error) => reject(error)
      );
    });
  });
};

// 获取用户收藏的帖子
export const getUserBookmarkedPosts = (userId = 1) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT 
          p.*,
          u.name as author_name,
          u.avatar as author_avatar,
          GROUP_CONCAT(DISTINCT t.name) as tags,
          GROUP_CONCAT(DISTINCT i.uri) as image_uris,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
          b.created_at as bookmarked_at
         FROM posts p
         LEFT JOIN users u ON p.user_id = u.id
         LEFT JOIN post_tags pt ON p.id = pt.post_id
         LEFT JOIN tags t ON pt.tag_id = t.id
         LEFT JOIN images i ON p.id = i.post_id
         INNER JOIN bookmarks b ON p.id = b.post_id
         WHERE b.user_id = ?
         GROUP BY p.id
         ORDER BY b.created_at DESC;`,
        [userId],
        (_, { rows }) => {
          const posts = rows._array.map(row => ({
            id: row.id.toString(),
            author: {
              id: row.user_id?.toString() || 'unknown',
              name: row.is_anonymous ? '匿名用户' : (row.author_name || '匿名用户'),
              avatar: row.is_anonymous ? '' : (row.author_avatar || '')
            },
            content: row.content,
            tags: row.tags ? row.tags.split(',') : [],
            likes: row.likes_count || 0,
            comments: [],
            createdAt: new Date(row.created_at).getTime(),
            bookmarkedAt: new Date(row.bookmarked_at).getTime()
          }));
          resolve(posts);
        },
        (_, error) => reject(error)
      );
    });
  });
};

// 更新用户信息
export const updateUser = (userId = 1, userData) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE users SET name = ?, bio = ?, avatar = ? WHERE id = ?;`,
        [userData.name, userData.bio, userData.avatar || '', userId],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// 获取用户信息
export const getUser = (userId = 1) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM users WHERE id = ?;`,
        [userId],
        (_, { rows }) => {
          if (rows.length > 0) {
            resolve(rows._array[0]);
          } else {
            reject(new Error('User not found'));
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};
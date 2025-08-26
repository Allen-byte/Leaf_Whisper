import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  StatusBar,
  Animated,
  Image,
  Modal,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { COLORS } from '../theme/colors';
import { getAllPosts, getPostCommentsCount } from '../services/onlineOnlyStorage';
import { useUser } from '../contexts/UserContext';

import CommentSvg from '../../assets/icons/comment.svg';
import { SERVER_BASE_URL } from '../config/env';
// import ImageViewer from '../components/ImageViewer';
import CommentsDrawer from '../components/CommentsDrawer';
import ImageViewer from 'react-native-image-zoom-viewer';
import { DailyTaskCard } from '../components/DailyTaskCard';
import { useFocusEffect } from '@react-navigation/native';
import { moods } from '../theme/moods';

const { width, height } = Dimensions.get('window');

// 保留原始PostCard组件以兼容其他地方的使用
export const PostCard = ({ item, onOpenComments, onOpenImage, onUserPress, onPress, showComments = true }) => {
  const timeAgo = (ts) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} 小时前`;
    const days = Math.floor(hrs / 24);
    return `${days} 天前`;
  };

  return (
    <Card style={{ marginBottom: 16, borderRadius: 0, borderBottomColor: COLORS.borderLight, borderBottomWidth: 1 }}>
      {/* 用户信息 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        {item.isAnonymous ? (
          <Avatar
            uri={item.author.avatar}
            name={item.author.name}
            size={36}
            style={{ marginRight: 10 }}
          />
        ) : (
          <Pressable onPress={() => onUserPress(item.author.id)}>
            <Avatar
              uri={item.author.avatar}
              name={item.author.name}
              size={36}
              style={{ marginRight: 10 }}
            />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Text style={{
              fontWeight: '600',
              color: COLORS.text,
              fontSize: 14
            }}>
              {item.author.name || '匿名用户'}
            </Text>
            {/* 心情显示 */}
            {item.mood && (
              <View style={{
                backgroundColor: COLORS.primaryLight,
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Text style={{
                  fontSize: 10,
                  color: COLORS.primary,
                  fontWeight: '500',
                  marginLeft: 2
                }}>
                  {item.mood}
                </Text>
                <Text style={{ fontSize: 12, paddingBottom: 2, marginLeft: 2 }}>
                  {(moods.find(m => m.value.trim() === item.mood?.trim()) || { emoji: '😊' }).emoji}
                </Text>
              </View>
            )}
          </View>
          <Text style={{
            color: COLORS.textMuted,
            fontSize: 12
          }}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => onPress(item.id)}
        activeOpacity={0.8}>
        {/* 内容 */}
        <Text style={{
          color: COLORS.text,
          fontSize: 15,
          lineHeight: 22,
          marginBottom: item.images?.length > 0 || item.tags?.length > 0 ? 12 : 16
        }}>
          {item.content}
        </Text>

        {/* 图片展示 */}
        {item.images && item.images.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {item.images.map((image, index) => (
                <View key={image.id} style={{ position: 'relative' }}>
                  <Pressable onPress={() => onOpenImage(item, index)}>
                    <Image
                      source={{ uri: SERVER_BASE_URL + image.uri }}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 8,
                        backgroundColor: COLORS.borderLight
                      }}
                    />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 标签展示 */}
        {item.tags && item.tags.length > 0 && (
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 16
          }}>
            {item.tags.map((tag, index) => (
              <Text
                key={`${item.id}-tag-${tag}-${index}`}
                style={{
                  color: COLORS.primary,
                  fontSize: 11,
                  paddingHorizontal: 2,
                  paddingVertical: 3,
                  borderRadius: 10,
                  fontWeight: '500'
                }}
              >
                #{tag}
              </Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );
};


// 现代化帖子卡片组件
export const ModernPostCard = ({ item, onOpenComments, onOpenImage, onUserPress, onPress, navigation, showComments = true }) => {
  const timeAgo = (ts) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} 小时前`;
    const days = Math.floor(hrs / 24);
    return `${days} 天前`;
  };

  const cardHeight = item.images?.length > 0 ? 400 : 280;
  const hasImage = item.images && item.images.length > 0;

  return (
    <TouchableOpacity
      onPress={() => onPress(item.id)}
      activeOpacity={0.95}
      style={{
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
        height: cardHeight,
      }}
    >
      {/* 背景图片或渐变 */}
      {hasImage ? (
        <Image
          source={{ uri: SERVER_BASE_URL + item.images[0].uri }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      )}

      {/* 毛玻璃遮罩 */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: hasImage ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)',
      }} />

      {/* 内容区域 */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
      }}>
        {/* 用户头像 */}
        <View style={{
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <TouchableOpacity onPress={() => onUserPress(item.author.id)}>
            <Avatar
              uri={item.author.avatar}
              name={item.author.name}
              size={60}
              style={{
                borderWidth: 3,
                borderColor: 'rgba(255,255,255,0.8)',
              }}
            />
          </TouchableOpacity>
        </View>

        {/* 用户名 */}
        <Text style={{
          fontSize: 24,
          fontWeight: '700',
          color: 'white',
          textAlign: 'center',
          marginBottom: 12,
          textShadowColor: 'rgba(0,0,0,0.3)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        }}>
          {item.author.name || '匿名用户'}
        </Text>

        {/* 内容预览 - 为纯文字帖子显示内容 */}
        {!hasImage && item.content && (
          <Text style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            marginBottom: 16,
            textShadowColor: 'rgba(0,0,0,0.3)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
            lineHeight: 22,
          }} numberOfLines={3}>
            {item.content}
          </Text>
        )}

        {/* 标签 */}
        {item.tags && item.tags.length > 0 && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 16,
          }}>
            {item.tags.slice(0, 2).map((tag, index) => (
              <View
                key={`${item.id}-tag-${tag}-${index}`}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 12,
                  fontWeight: '500',
                }}>
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 心情和状态 */}
        {item.mood && (
          <View style={{
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <View style={{
              backgroundColor: 'rgba(135, 206, 250, 0.9)',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
              <Text style={{
                color: 'white',
                fontSize: 12,
                fontWeight: '600',
              }}>
                {(() => {
                  const mood = moods.find(m => m.value.trim() === item.mood?.trim());
                  return mood ? `${mood.emoji} ${mood.label}` : item.mood;
                })()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 统计信息 */}
      <View style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}>
        <Text style={{
          fontSize: 11,
          fontWeight: '600',
          color: '#333',
        }}>
          {item.comments_count || 0} 评论
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const HomeScreen = ({ navigation, route }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerImages, setViewerImages] = useState([]);
  const [commentsDrawerVisible, setCommentsDrawerVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDailyTask, setShowDailyTask] = useState(false); // 暂时隐藏每日任务
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const { user, isLoggedIn } = useUser();

  // 更新特定帖子的评论数量
  const updatePostCommentCount = (postId, newCount) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, comments_count: newCount }
          : post
      )
    );
  };

  const openImageViewer = (post, imgIndex) => {
    const imgs = post.images.map(img => ({
      uri: SERVER_BASE_URL + img.uri,
      // 必须唯一
      id: img.id,
    }));
    setViewerImages(imgs);
    setViewerIndex(imgIndex);
    setViewerVisible(true);
  };

  const closePreview = () => setPreviewVisible(false);

  const openComments = (post) => {
    setSelectedPost(post);
    setCommentsDrawerVisible(true);
  };

  const loadPosts = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getAllPosts(pageNum, 20);


      if (response.success) {
        const { posts: newPosts, hasMore: hasMoreData } = response.data;

        if (append) {
          setPosts(prev => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }

        setHasMore(hasMoreData);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('加载帖子失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 处理头像点击
  const handleUserPress = (userId) => {
    navigation.navigate('UserProfile', { userId: userId });
  };

  //处理卡片点击，进入详情页
  const handleCardPress = (postId) => {
    navigation.navigate('PostDetail', { postId: postId });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts(1, false);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadPosts(page + 1, true);
    }
  };

  useEffect(() => {
    loadPosts(1, false);
  }, []);

  useEffect(() => {
    const sub = navigation.addListener('focus', () => {
      if (route?.params?.shouldRefresh) {
        loadPosts(1, false);
        navigation.setParams({ shouldRefresh: undefined });
      }
    });
    return sub;
  }, [navigation, route?.params?.shouldRefresh]);


  const handleTaskPress = (taskData) => {
    navigation.navigate('Create', {
      taskData: taskData,
      fromDailyTask: true
    });
  };

  const handleTaskDismiss = () => {
    setShowDailyTask(false);
  };

  return (
    <View style={{ flex: 1, paddingTop: 30 }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 背景渐变 */}
      <LinearGradient
        colors={['#E6E6FA', '#DDA0DD', '#DA70D6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* 顶部用户信息区域 */}
        <View style={{
          paddingTop: 20,
          paddingHorizontal: 20,
          paddingBottom: 20,
          alignItems: 'center',
        }}>
          {isLoggedIn && user && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 20,
              }}
            >
              <Avatar
                uri={user.avatar}
                name={user.name}
                size={24}
                style={{ marginRight: 8 }}
              />
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '600',
              }}>
                {user.name}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={{
            fontSize: 32,
            fontWeight: '300',
            color: 'white',
            textAlign: 'center',
            marginBottom: 16,
            textShadowColor: 'rgba(0,0,0,0.1)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}>
            find fun ideas ✨ 
          </Text>
        </View>

        {/* 帖子列表 */}
        {loading && posts.length === 0 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <ActivityIndicator size="large" color="white" />
            <Text style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 16,
              marginTop: 12
            }}>
              正在加载...
            </Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 120
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['white']}
                tintColor="white"
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            renderItem={({ item }) => (
              <ModernPostCard
                item={item}
                onOpenComments={openComments}
                onOpenImage={openImageViewer}
                onUserPress={handleUserPress}
                onPress={handleCardPress}
                navigation={navigation}
              />
            )}
            ListFooterComponent={() => {
              if (loadingMore) {
                return (
                  <View style={{
                    paddingVertical: 20,
                    alignItems: 'center'
                  }}>
                    <ActivityIndicator size="small" color="white" />
                  </View>
                );
              }

              if (!hasMore && posts.length > 0) {
                return (
                  <View style={{
                    paddingVertical: 20,
                    alignItems: 'center'
                  }}>
                    <Text style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 12
                    }}>
                      没有更多内容了
                    </Text>
                  </View>
                );
              }

              return null;
            }}
            ListEmptyComponent={() => (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 60,
              }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 20,
                }}>
                  <Text style={{ fontSize: 32 }}>💭</Text>
                </View>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: 8
                }}>
                  还没有内容
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 14,
                  textAlign: 'center'
                }}>
                  成为第一个分享的人吧
                </Text>
              </View>
            )}
          />
        )}

        <CommentsDrawer
          visible={commentsDrawerVisible}
          onClose={() => {
            setCommentsDrawerVisible(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
          onCommentCountUpdate={updatePostCommentCount}
        />
      </SafeAreaView>

      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <ImageViewer
          imageUrls={viewerImages.map(img => ({ url: img.uri }))}
          index={viewerIndex}
          enableSwipeDown
          onSwipeDown={() => setViewerVisible(false)}
          onClick={() => setViewerVisible(false)}
          saveToLocalByLongPress={false}
          renderIndicator={() => null}
        />
      </Modal>
    </View>
  );
};
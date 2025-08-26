import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  FlatList,
  Image,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { COLORS } from '../theme/colors';
import { BackgroundImage } from '../components/ui/BackgroundImage';
import { getUserProfile, getUserPublicPosts } from '../services/onlineOnlyStorage';
import { SERVER_BASE_URL } from '../config/env';
import CommentSvg from '../../assets/icons/comment.svg';
import CommentsDrawer from '../components/CommentsDrawer';
import ImageViewer from 'react-native-image-zoom-viewer';
import UserService from '../services/userService';
import { useUser } from '../contexts/UserContext';
import { useToastContext } from '../contexts/ToastContext';

// Twitter风格统计项组件
const TwitterStatItem = ({ label, value, subtitle }) => (
  <View style={{ alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={{
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.3,
      }}>
        {value}
      </Text>
      {subtitle && (
        <Text style={{
          fontSize: 12,
          color: COLORS.textMuted,
          marginLeft: 2,
          fontWeight: '500',
        }}>
          {subtitle}
        </Text>
      )}
    </View>
    <Text style={{
      fontSize: 13,
      color: COLORS.textSecondary,
      fontWeight: '400',
      marginTop: 2,
    }}>
      {label}
    </Text>
  </View>
);

// 用户帖子卡片组件（简化版，不包含编辑删除功能）
const UserPostCard = ({ item, onOpenComments, onOpenImage, onPress }) => {
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
    <Card style={{ marginBottom: 16 }}>
      {/* 点击事件 */}
      <Pressable onPress={() => onPress(item.id)}>
        {/* 用户信息 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Avatar
            uri={item.author.avatar}
            name={item.author.name}
            size={36}
            style={{ marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  <Text style={{ fontSize: 12 }}>
                    {item.mood === '开心' ? '😊' :
                      item.mood === '难过' ? '😢' :
                        item.mood === '生气' ? '😤' :
                          item.mood === '疲惫' ? '😴' :
                            item.mood === '思考' ? '🤔' :
                              item.mood === '感动' ? '❤️' : '😊'}
                  </Text>
                  <Text style={{
                    fontSize: 10,
                    color: COLORS.primary,
                    fontWeight: '500',
                    marginLeft: 2
                  }}>
                    {item.mood}
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
        {/* 内容 */}
        <Text style={{
          color: COLORS.text,
          fontSize: 15,
          lineHeight: 22,
          marginBottom: item.images?.length > 0 || item.tags?.length > 0 ? 12 : 16,
          borderBottomColor: COLORS.borderLight,
          borderBottomWidth: 1,
          paddingVertical: 10
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
      </Pressable>


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
              key={index}
              style={{
                backgroundColor: COLORS.primaryLight,
                color: COLORS.primary,
                fontSize: 11,
                paddingHorizontal: 8,
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
    </Card>
  );
};

export const UserProfileScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerImages, setViewerImages] = useState([]);
  const [commentsDrawerVisible, setCommentsDrawerVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // 关注功能相关状态
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStats, setFollowStats] = useState({ following: 0, followers: 0 });
  const [followLoading, setFollowLoading] = useState(false);
  
  const { user: currentUser } = useUser();
  const { showSuccess, showError } = useToastContext();
  
  // 检查是否是当前用户自己的页面
  const isOwnProfile = currentUser && currentUser.id === parseInt(userId);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // 并行加载用户信息、帖子、关注状态和关注统计
      const promises = [
        getUserProfile(userId),
        getUserPublicPosts(userId),
        UserService.getFollowStats(userId)
      ];
      
      const results = await Promise.all(promises);
      const [profileResponse, postsResponse, followStatsResponse] = results;
      
      // 如果不是自己的页面且已登录，检查关注状态
      let followStatusResponse = null;
      if (!isOwnProfile && currentUser) {
        try {
          followStatusResponse = await UserService.checkFollowStatus(userId);
        } catch (error) {
          console.error('检查关注状态失败:', error);
          // 关注状态检查失败不影响页面加载
        }
      }

      if (profileResponse.success) {
        setUser(profileResponse.data);
      }

      if (postsResponse.success) {
        setPosts(postsResponse.data || []);
      }
      
      if (followStatsResponse.success) {
        setFollowStats({
          following: followStatsResponse.stats.following || 0,
          followers: followStatsResponse.stats.followers || 0
        });
      }
      
      if (followStatusResponse && followStatusResponse.success) {
        setIsFollowing(followStatusResponse.isFollowing || false);
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };
  
  // 处理关注/取消关注
  const handleFollowToggle = async () => {
    if (!currentUser) {
      showError('请先登录');
      return;
    }
    
    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        const response = await UserService.unfollowUser(userId);
        if (response.success) {
          setIsFollowing(false);
          setFollowStats(prev => ({ ...prev, followers: prev.followers - 1 }));
          showSuccess('已取消关注');
        } else {
          showError(response.error || '取消关注失败');
        }
      } else {
        const response = await UserService.followUser(userId);
        if (response.success) {
          setIsFollowing(true);
          setFollowStats(prev => ({ ...prev, followers: prev.followers + 1 }));
          showSuccess('关注成功');
        } else {
          showError(response.error || '关注失败');
        }
      }
    } catch (error) {
      console.error('关注操作失败:', error);
      showError(isFollowing ? '取消关注失败' : '关注失败');
    } finally {
      setFollowLoading(false);
    }
  };

  const openImageViewer = (post, imgIndex) => {
    const imgs = post.images.map(img => ({
      uri: SERVER_BASE_URL + img.uri,
      id: img.id,
    }));
    setViewerImages(imgs);
    setViewerIndex(imgIndex);
    setViewerVisible(true);
  };

  const openComments = (post) => {
    setSelectedPost(post);
    setCommentsDrawerVisible(true);
  };

  //处理卡片点击，进入详情页
  const handleCardPress = (postId) => {
    navigation.navigate('PostDetail', { postId: postId });
  };

  const diffInDays = (target) => {
    const msPerDay = 864e5;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(target);
    targetDate.setHours(0, 0, 0, 0);
    return Math.round((today - targetDate) / msPerDay);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{
            color: COLORS.textMuted,
            fontSize: 16,
            marginTop: 12
          }}>
            正在加载...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>😔</Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: COLORS.text,
            marginBottom: 8
          }}>
            用户不存在
          </Text>
          <Button
            title="返回"
            variant="primary"
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Twitter风格顶部横幅 */}
          <View style={{ position: 'relative' }}>
            {/* 横幅背景 */}
            <BackgroundImage
              imagePath={user?.background_image || ''}
              style={{ height: 200, width: '100%' }}
            />

            {/* 返回按钮 */}
            <View style={{
              position: 'absolute',
              top: 50,
              left: 20,
              zIndex: 2,
            }}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <Ionicons name="arrow-back" size={20} color="white" />
              </Pressable>
            </View>
          </View>

          {/* 用户信息区域 */}
          <View style={{
            backgroundColor: COLORS.surface,
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}>
            {/* 头像 - 重叠在横幅上 */}
            <View style={{
              marginTop: -50,
              marginBottom: 15,
            }}>
              <Avatar
                size={100}
                name={user?.name || '匿名用户'}
                uri={user?.avatar}
                style={{
                  borderWidth: 4,
                  borderColor: COLORS.surface,
                }}
              />
            </View>

            {/* 用户名和邮箱 */}
            <View style={{ marginBottom: 15 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '800',
                    color: COLORS.text,
                    letterSpacing: -0.5,
                  }}>
                    {user?.name || '匿名用户'}
                  </Text>

                  {/* 性别图标 */}
                  {user?.sex && (
                    <View style={{
                      marginLeft: 8,
                      backgroundColor: user?.sex === 'male' ? '#e3f2fd' : '#fce4ec',
                      paddingHorizontal: 6,
                      paddingVertical: 3,
                      borderRadius: 10,
                    }}>
                      <Ionicons
                        name={user?.sex === 'male' ? 'male' : 'female'}
                        size={12}
                        color={user?.sex === 'male' ? '#2196f3' : '#e91e63'}
                      />
                    </View>
                  )}
                </View>
                
                {/* 关注按钮 - 只在不是自己的页面时显示 */}
                {!isOwnProfile && currentUser && (
                  <Pressable
                    onPress={handleFollowToggle}
                    disabled={followLoading}
                    style={{
                      backgroundColor: isFollowing ? COLORS.surface : COLORS.primary,
                      borderWidth: isFollowing ? 1 : 0,
                      borderColor: isFollowing ? COLORS.border : 'transparent',
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                      borderRadius: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      opacity: followLoading ? 0.7 : 1,
                    }}
                  >
                    {followLoading ? (
                      <ActivityIndicator size="small" color={isFollowing ? COLORS.text : 'white'} />
                    ) : (
                      <>
                        <Ionicons 
                          name={isFollowing ? 'person-remove' : 'person-add'} 
                          size={16} 
                          color={isFollowing ? COLORS.text : 'white'} 
                        />
                        <Text style={{
                          color: isFollowing ? COLORS.text : 'white',
                          fontSize: 14,
                          fontWeight: '600',
                        }}>
                          {isFollowing ? '已关注' : '关注'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>

              {/* 邮箱 */}
              <Text style={{
                fontSize: 15,
                color: COLORS.textSecondary,
                marginBottom: 8,
              }}>
                {user?.email === '' ? '无邮箱' : `@${user?.email}`}
              </Text>
            </View>

            {/* 个人简介 */}
            <Text style={{
              fontSize: 15,
              color: COLORS.text,
              lineHeight: 20,
              marginBottom: 15,
            }}>
              {user?.bio || 'hopefully be nice'}
            </Text>

            {/* 加入时间 */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
              <Text style={{
                fontSize: 14,
                color: COLORS.textSecondary,
                marginLeft: 6,
              }}>
                {new Date(user?.created_at).toLocaleDateString('zh-CN') ?? '2025年1月'} 加入
              </Text>
            </View>

            {/* 关注和粉丝统计 */}
            <View style={{
              flexDirection: 'row',
              marginBottom: 20,
              gap: 20,
            }}>
              <Pressable onPress={() => navigation.navigate('MyFollowing', { userId, userName: user?.name })}>
                {({ pressed }) => (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: pressed ? 0.7 : 1,
                  }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: COLORS.text,
                      marginRight: 4,
                    }}>
                      {followStats.following}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: COLORS.textSecondary,
                    }}>
                      关注
                    </Text>
                  </View>
                )}
              </Pressable>
              
              <Pressable onPress={() => navigation.navigate('MyFollowers', { userId, userName: user?.name })}>
                {({ pressed }) => (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: pressed ? 0.7 : 1,
                  }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: COLORS.text,
                      marginRight: 4,
                    }}>
                      {followStats.followers}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: COLORS.textSecondary,
                    }}>
                      粉丝
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Twitter风格统计数据 */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              paddingVertical: 15,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: COLORS.borderLight,
            }}>
              <TwitterStatItem
                label="发布"
                value={user?.stats?.posts || 0}
              />
              <TwitterStatItem
                label="评论"
                value={user?.stats?.comments || 0}
              />
              <TwitterStatItem
                label="加入"
                value={diffInDays(user?.created_at?.split("T")[0])}
                subtitle="天"
              />
            </View>
          </View>

          {/* 帖子列表 */}
          <View style={{
            backgroundColor: COLORS.surface,
            marginTop: 10,
            paddingHorizontal: 20,
            paddingTop: 20,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: COLORS.text,
              marginBottom: 16,
            }}>
              Ta的帖子 · {posts.length}
            </Text>

            {posts.length === 0 ? (
              <View style={{
                alignItems: 'center',
                paddingVertical: 40,
              }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📝</Text>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: COLORS.text,
                  marginBottom: 8,
                }}>
                  还没有发布内容
                </Text>
                <Text style={{
                  color: COLORS.textMuted,
                  fontSize: 14,
                  textAlign: 'center',
                }}>
                  Ta还没有分享任何内容
                </Text>
              </View>
            ) : (
              posts.map((post) => (
                <UserPostCard
                  key={post.id}
                  item={post}
                  onOpenComments={openComments}
                  onOpenImage={openImageViewer}
                  onPress={() => handleCardPress(post.id)}
                />
              ))
            )}
          </View>
        </ScrollView>

        <CommentsDrawer
          visible={commentsDrawerVisible}
          onClose={() => {
            setCommentsDrawerVisible(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
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
    </>
  );
};
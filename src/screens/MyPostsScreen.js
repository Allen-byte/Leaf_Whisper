import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Image,
  ScrollView,
  Pressable,
  Modal,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { COLORS } from '../theme/colors';
import { getMyPosts, deletePost } from '../services/onlineOnlyStorage';
import { useToastContext } from '../contexts/ToastContext';
import CommentSvg from '../../assets/icons/comment.svg';
import { SERVER_BASE_URL } from '../config/env';
import CommentsDrawer from '../components/CommentsDrawer';
import ImageViewer from 'react-native-image-zoom-viewer';
import { moods } from '../theme/moods';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;


// 时间格式化函数
const timeAgo = (ts) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  const date = new Date(ts);
  return date.toLocaleDateString();
};

// 个人专属渐变色方案 - 温暖的个人色调
const personalGradients = [
  ['#667eea', '#764ba2', '#f093fb'],
  ['#f093fb', '#f5576c', '#4facfe'],
  ['#43e97b', '#38f9d7', '#667eea'],
  ['#fa709a', '#fee140', '#ffecd2'],
  ['#a8edea', '#fed6e3', '#d299c2'],
  ['#ffecd2', '#fcb69f', '#ff8a80'],
  ['#ff9a9e', '#fecfef', '#fecfef'],
  ['#a18cd1', '#fbc2eb', '#ffeaa7'],
  ['#fad0c4', '#ffd1ff', '#a8e6cf'],
  ['#ff8a80', '#ffab91', '#ffcc80'],
];

// 获取个人专属渐变色
const getPersonalGradient = (postId, isPublic) => {
  const baseIndex = postId % personalGradients.length;
  return personalGradients[baseIndex];
};

// 我的帖子卡片组件 - 个人画廊风格
const MyPostCard = ({ item, onEdit, onDelete, onOpenComments, onOpenImage, onPress, index }) => {
  const hasImage = item.images && item.images.length > 0;
  const gradientColors = getPersonalGradient(item.id, item.is_public === 1);

  // 动画值
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // 浮动动画
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 4000 + (index * 300),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 4000 + (index * 300),
          useNativeDriver: true,
        }),
      ])
    );

    floatAnimation.start();
    return () => floatAnimation.stop();
  }, []);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  return (
    <Animated.View style={{
      width: cardWidth,
      marginBottom: 20,
      transform: [
        { translateY: floatY },
        { rotate: index % 4 === 0 ? '1deg' : index % 4 === 1 ? '-0.5deg' : index % 4 === 2 ? '0.8deg' : '-0.3deg' },
      ],
      shadowColor: hasImage ? 'rgba(0,0,0,0.3)' : gradientColors[0],
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 5,
    }}>
      <Pressable
        onPress={() => onPress(item.id)}
        onPressIn={() => {
          Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            tension: 400,
            friction: 8,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 400,
            friction: 8,
          }).start();
        }}
        activeOpacity={1}
      >
        <Animated.View
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            height: 300,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.4)',
            backgroundColor: 'rgba(255,255,255,0.1)',
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* 主背景 */}
          {hasImage ? (
            <>
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
              <LinearGradient
                colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                locations={[0, 0.5, 1]}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
            </>
          ) : (
            <LinearGradient
              colors={gradientColors}
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

          {/* 个人专属光晕 */}
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.5)',
              'rgba(255,255,255,0.2)',
              'transparent'
            ]}
            locations={[0, 0.4, 1]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 100,
            }}
          />

          {/* 顶部状态栏 */}
          <View style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {/* 发布时间 */}
            <Text style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 11,
              fontWeight: '600',
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}>
              {timeAgo(item.createdAt)}
            </Text>

            {/* 可见性标识 */}
            <View style={{
              backgroundColor: item.is_public === 1 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255, 152, 0, 0.8)',
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.3)',
            }}>
              <Text style={{
                color: 'white',
                fontSize: 10,
                fontWeight: '600',
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 1,
              }}>
                {item.is_public === 1 ? '🌞 公开' : '🤫 私密'}
              </Text>
            </View>
          </View>

          {/* 内容区域 */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
          }}>
            {/* 内容预览 */}
            <Text style={{
              fontSize: 13,
              color: 'white',
              textAlign: 'center',
              lineHeight: 18,
              marginBottom: 12,
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }} numberOfLines={4}>
              {item.content.length > 30 ? item.content.slice(0, 80) + "..." : item.content}
            </Text>

            {/* 心情状态 */}
            {item.mood && (
              <View style={{
                alignItems: 'center',
                marginBottom: 10,
              }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  borderRadius: 14,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.4)',
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 11,
                    fontWeight: '600',
                    textShadowColor: 'rgba(0,0,0,0.4)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}>
                    {(() => {
                      const mood = moods.find(m => m.value.trim() === item.mood?.trim());
                      return mood ? `${mood.emoji} ${mood.label}` : item.mood;
                    })()}
                  </Text>
                </View>
              </View>
            )}

            {/* 标签 */}
            {item.tags && item.tags.length > 0 && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 8,
              }}>
                {item.tags.slice(0, 2).map((tag, tagIndex) => (
                  <View
                    key={`${item.id}-tag-${tag}-${tagIndex}`}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 10,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <Text style={{
                      color: 'white',
                      fontSize: 10,
                      fontWeight: '500',
                    }}>
                      #{tag}
                    </Text>
                  </View>
                ))}
                {item.tags.length > 2 && (
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}>
                    <Text style={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: 10,
                      fontWeight: '500',
                    }}>
                      +{item.tags.length - 2}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 底部操作区 */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}>
              <Pressable
                onPress={() => onEdit(item)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  padding: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                <Ionicons name="create-outline" size={14} color="white" />
              </Pressable>

              <Pressable
                onPress={() => onDelete(item.id)}
                style={{
                  backgroundColor: 'rgba(244, 67, 54, 0.3)',
                  borderRadius: 12,
                  padding: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                <Ionicons name="trash-outline" size={14} color="white" />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export const MyPostsScreen = ({ navigation, route }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerImages, setViewerImages] = useState([]);
  const [commentsDrawerVisible, setCommentsDrawerVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState('public');
  const { showInfo, showConfirm, showError } = useToastContext();
  const { user } = useUser();


  useEffect(() => {
    loadMyPosts();
  }, []);

  // 添加监听导航参数的逻辑
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.shouldRefresh) {
        loadMyPosts();
        navigation.setParams({ shouldRefresh: undefined });
      }
    });
    return unsubscribe;
  }, [navigation, route.params?.shouldRefresh]);

  const loadMyPosts = async () => {
    try {
      setLoading(true);
      const response = await getMyPosts();
      setPosts(response.data || []);
    } catch (error) {
      console.error('加载我的帖子失败:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMyPosts();
    setRefreshing(false);
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

  const handleEdit = (post) => {
    navigation.navigate('EditPost', { postId: post.id });
  };

  const handleDelete = (postId) => {
    showConfirm({
      title: '删除帖子',
      message: '确定要删除这条帖子吗？删除后无法恢复。',
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await deletePost(postId);
          if (response.success) {
            setPosts(prev => prev.filter(p => p.id !== postId));
          } else {
            showError(response.error || '删除失败');
          }
        } catch (error) {
          console.error('删除帖子失败:', error);
          showError('删除失败，请重试');
        }
      }
    });
  };

  // 新增：根据标签页过滤帖子
  const getFilteredPosts = () => {
    return posts.filter(post => {
      if (activeTab === 'public') {
        return post.is_public === 1;
      } else {
        return post.is_public === 0;
      }
    });
  };

  //处理卡片点击，进入详情页
  const handleCardPress = (postId) => {
    navigation.navigate('PostDetail', { postId: postId });
  };

  const filteredPosts = getFilteredPosts();
  const publicCount = posts.filter(p => p.is_public === 1).length;
  const privateCount = posts.filter(p => p.is_public === 0).length;

  // 个人专属分段控制器组件
  const PersonalSegmentedControl = () => (
    <View style={{
      marginHorizontal: 20,
      marginVertical: 16,
    }}>
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
        style={{
          flexDirection: 'row',
          borderRadius: 16,
          padding: 6,
          borderWidth: 1,
          borderColor: 'rgba(102, 126, 234, 0.2)',
        }}
      >
        <Pressable
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: activeTab === 'public' ? 'rgba(102, 126, 234, 0.8)' : 'transparent',
            alignItems: 'center',
            shadowColor: activeTab === 'public' ? 'rgba(102, 126, 234, 0.5)' : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: activeTab === 'public' ? 3 : 0,
          }}
          onPress={() => setActiveTab('public')}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: activeTab === 'public' ? 'white' : COLORS.text,
          }}>
            🌞 公开空间 · {publicCount}
          </Text>
        </Pressable>

        <Pressable
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            backgroundColor: activeTab === 'private' ? 'rgba(255, 152, 0, 0.8)' : 'transparent',
            alignItems: 'center',
            shadowColor: activeTab === 'private' ? 'rgba(255, 152, 0, 0.5)' : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: activeTab === 'private' ? 3 : 0,
          }}
          onPress={() => setActiveTab('private')}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: activeTab === 'private' ? 'white' : COLORS.text,
          }}>
            🤫 个人空间 · {privateCount}
          </Text>
        </Pressable>
      </LinearGradient>
    </View>
  );

  // 个人专属空状态组件
  const renderPersonalEmptyState = () => {
    const isPublicTab = activeTab === 'public';
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60
      }}>
        <LinearGradient
          colors={isPublicTab ? ['#667eea', '#764ba2'] : ['#fa709a', '#fee140']}
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            shadowColor: isPublicTab ? '#667eea' : '#fa709a',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 48 }}>
            {isPublicTab ? '🌞' : '🤫'}
          </Text>
        </LinearGradient>

        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: COLORS.text,
          marginBottom: 8,
          textAlign: 'center',
        }}>
          {isPublicTab ? '你的公开展示台' : '你的个人空间'}
        </Text>

        <Text style={{
          color: COLORS.textMuted,
          fontSize: 15,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 32,
        }}>
          {isPublicTab
            ? '这里将展示你与世界分享的精彩内容\n让更多人看到你的想法和创作'
            : '这里是你的私人空间\n记录只属于自己的珍贵时光'
          }
        </Text>

        <LinearGradient
          colors={isPublicTab ? ['#667eea', '#764ba2'] : ['#fa709a', '#fee140']}
          style={{
            borderRadius: 25,
            paddingHorizontal: 32,
            paddingVertical: 14,
            shadowColor: isPublicTab ? '#667eea' : '#fa709a',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Pressable onPress={() => navigation.navigate('Create')}>
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center',
            }}>
              {isPublicTab ? '✨ 开始分享' : '🌱 开始记录'}
            </Text>
          </Pressable>
        </LinearGradient>
      </View>
    );
  };

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface, paddingTop: 30 }}>
        {/* 个人专属头部 */}
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.borderLight,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{
                marginRight: 16,
                padding: 4,
              }}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 24,
                fontWeight: '800',
                color: COLORS.text,
                marginBottom: 2,
              }}>
                我的创作空间
              </Text>
              <Text style={{
                fontSize: 14,
                color: COLORS.textMuted,
              }}>
                {user?.name || '创作者'} 的个人展示台
              </Text>
            </View>

            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={{
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                shadowColor: '#667eea',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '700',
              }}>
                {posts.length} 篇
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* 个人专属分段控制器 */}
        <PersonalSegmentedControl />

        {/* 帖子画廊 */}
        {loading && posts.length === 0 ? (
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
              正在加载你的创作...
            </Text>
          </View>
        ) : filteredPosts.length === 0 ? (
          renderPersonalEmptyState()
        ) : (
          <FlatList
            data={filteredPosts}
            renderItem={({ item, index }) => (
              <MyPostCard
                item={item}
                index={index}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onOpenComments={openComments}
                onOpenImage={openImageViewer}
                onPress={handleCardPress}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: 'space-between',
              paddingHorizontal: 20,
            }}
            contentContainerStyle={{
              paddingTop: 20,
              paddingBottom: 100,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
          />
        )}

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
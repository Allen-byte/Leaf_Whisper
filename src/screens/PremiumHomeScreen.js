import React, { useState, useEffect, useRef } from 'react';
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
import { getAllPosts, getPostCommentsCount, getNotifications } from '../services/onlineOnlyStorage';
import { useUser } from '../contexts/UserContext';
import { SERVER_BASE_URL } from '../config/env';
import CommentsDrawer from '../components/CommentsDrawer';
import ImageViewer from 'react-native-image-zoom-viewer';
import { DailyTaskCardWithAnimation } from '../components/DailyTaskCardWithAnimation';
import { useFocusEffect } from '@react-navigation/native';
import { moods } from '../theme/moods';
import { gradients } from '../theme/postsColor';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// 时间格式化函数
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

// 高级渐变色方案
const premiumGradients = [
  // 奢华紫金系
  ['#8B5CF6', '#A855F7', '#C084FC', '#DDD6FE'],
  ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD'],
  
  // 现代蓝调系
  ['#0EA5E9', '#0284C7', '#0369A1', '#075985'],
  ['#06B6D4', '#0891B2', '#0E7490', '#155E75'],
  
  // 温暖日落系
  ['#F59E0B', '#D97706', '#B45309', '#92400E'],
  ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
  
  // 自然绿意系
  ['#10B981', '#059669', '#047857', '#065F46'],
  ['#84CC16', '#65A30D', '#4D7C0F', '#365314'],
  
  // 优雅粉调系
  ['#EC4899', '#DB2777', '#BE185D', '#9D174D'],
  ['#F472B6', '#EC4899', '#DB2777', '#BE185D'],
];

// 获取智能渐变色
const getSmartGradient = (postId, hasImage, mood) => {
  const hour = new Date().getHours();
  let baseIndex = postId % premiumGradients.length;
  
  // 根据时间调整色调
  if (hour >= 6 && hour < 12) baseIndex = Math.max(0, baseIndex - 1); // 清晨用更清淡的色彩
  else if (hour >= 18 && hour < 22) baseIndex = Math.min(premiumGradients.length - 1, baseIndex + 1); // 傍晚用更深沉的色彩
  
  return premiumGradients[baseIndex];
};

// 高级卡片组件
const PremiumPostCard = ({ item, onOpenComments, onOpenImage, onUserPress, onPress, navigation, index = 0 }) => {
  const hasImage = item.images && item.images.length > 0;
  const contentLength = item.content?.length || 0;
  
  // 动画值
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // 启动动画
  useEffect(() => {
    // 浮动动画
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

    // 微光效果
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    );

    // 光晕效果
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );

    // 旋转装饰
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    );

    floatAnimation.start();
    shimmerAnimation.start();
    glowAnimation.start();
    rotateAnimation.start();

    return () => {
      floatAnimation.stop();
      shimmerAnimation.stop();
      glowAnimation.stop();
      rotateAnimation.stop();
    };
  }, []);

  // 计算动画值
  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const floatX = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, index % 2 === 0 ? 4 : -4],
  });

  const shimmerX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, width + 150],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const rotateZ = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // 动态卡片高度
  const cardHeight = hasImage ? 480 : (contentLength > 100 ? 420 : 360);
  const gradientColors = getSmartGradient(item.id, hasImage, item.mood);

  return (
    <Animated.View style={{
      marginBottom: 32,
      marginHorizontal: 4,
      transform: [
        { translateY: floatY },
        { translateX: floatX },
        { rotate: index % 3 === 0 ? '2deg' : index % 3 === 1 ? '-1deg' : '0.5deg' },
      ],
      // 高级阴影
      shadowColor: hasImage ? 'rgba(0,0,0,0.4)' : gradientColors[0],
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 30,
      elevation: 25,
    }}>
      
      {/* 外层光晕效果 */}
      <Animated.View style={{
        position: 'absolute',
        top: -8,
        left: -8,
        right: -8,
        bottom: -8,
        borderRadius: 40,
        opacity: glowOpacity,
        zIndex: 0,
      }}>
        <LinearGradient
          colors={[`${gradientColors[0]}40`, `${gradientColors[1]}20`, 'transparent']}
          style={{
            flex: 1,
            borderRadius: 40,
          }}
        />
      </Animated.View>

      {/* 旋转装饰环 */}
      <Animated.View style={{
        position: 'absolute',
        top: -16,
        right: -16,
        width: 60,
        height: 60,
        zIndex: 4,
        transform: [{ rotate: rotateZ }],
      }}>
        <LinearGradient
          colors={[gradientColors[0], gradientColors[1], gradientColors[2]]}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: gradientColors[0],
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 24 }}>✨</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* 微光扫过效果 */}
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        left: shimmerX,
        width: 120,
        height: '100%',
        zIndex: 3,
        opacity: 0.4,
      }}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.6)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 36,
          }}
        />
      </Animated.View>

      <TouchableOpacity
        onPress={() => onPress(item.id)}
        onPressIn={() => {
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 0.96,
              useNativeDriver: true,
              tension: 400,
              friction: 8,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.85,
              duration: 150,
              useNativeDriver: true,
            })
          ]).start();
        }}
        onPressOut={() => {
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 400,
              friction: 8,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            })
          ]).start();
        }}
        activeOpacity={1}
      >
        <Animated.View
          style={{
            borderRadius: 36,
            overflow: 'hidden',
            height: cardHeight,
            borderWidth: 3,
            borderColor: 'rgba(255,255,255,0.4)',
            backgroundColor: 'rgba(255,255,255,0.12)',
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
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
              {/* 图片渐变遮罩 */}
              <LinearGradient
                colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                locations={[0, 0.4, 1]}
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

          {/* 高级毛玻璃层 */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: hasImage ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.15)',
          }} />

          {/* 顶部光晕 */}
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.6)', 
              'rgba(255,255,255,0.3)', 
              'rgba(255,255,255,0.1)',
              'transparent'
            ]}
            locations={[0, 0.3, 0.6, 1]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 150,
            }}
          />

          {/* 底部内容增强 */}
          <LinearGradient
            colors={[
              'transparent',
              'rgba(0,0,0,0.2)',
              'rgba(0,0,0,0.5)',
              'rgba(0,0,0,0.7)'
            ]}
            locations={[0, 0.2, 0.6, 1]}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 250,
            }}
          />

          {/* 内容区域 */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 32,
          }}>
            {/* 头像区域 */}
            <View style={{
              alignItems: 'center',
              marginBottom: 24,
            }}>
              {!item.isAnonymous ? (
                <TouchableOpacity onPress={() => onUserPress(item.author.id)}>
                  <View style={{
                    shadowColor: 'rgba(255,255,255,1)',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 1,
                    shadowRadius: 20,
                    elevation: 15,
                  }}>
                    <View style={{
                      width: 88,
                      height: 88,
                      borderRadius: 44,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 4,
                      borderColor: 'rgba(255,255,255,0.6)',
                    }}>
                      <Avatar
                        uri={item.author.avatar}
                        name={item.author.name}
                        size={76}
                        style={{
                          borderWidth: 4,
                          borderColor: 'rgba(255,255,255,1)',
                        }}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 4,
                  borderColor: 'rgba(255,255,255,0.4)',
                }}>
                  <Ionicons name="person" size={40} color="rgba(255,255,255,0.9)" />
                </View>
              )}
            </View>

            {/* 用户名 */}
            <Text style={{
              fontSize: 32,
              fontWeight: '900',
              color: 'white',
              textAlign: 'center',
              marginBottom: 20,
              textShadowColor: 'rgba(0,0,0,0.8)',
              textShadowOffset: { width: 0, height: 4 },
              textShadowRadius: 12,
              letterSpacing: 1.5,
              lineHeight: 38,
            }}>
              {item.author.name || '匿名用户'}
            </Text>

            {/* 内容预览 */}
            {!hasImage && item.content && (
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.25)',
                borderRadius: 24,
                paddingHorizontal: 24,
                paddingVertical: 20,
                marginBottom: 24,
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.35)',
                shadowColor: 'rgba(0,0,0,0.2)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 6,
              }}>
                <Text style={{
                  fontSize: 18,
                  color: 'rgba(255,255,255,1)',
                  textAlign: 'center',
                  textShadowColor: 'rgba(0,0,0,0.6)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                  lineHeight: 28,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                }} numberOfLines={3}>
                  {item.content.length > 80 ? item.content.slice(0, 80) + "..." : item.content}
                </Text>
              </View>
            )}

            {/* 标签云 */}
            {item.tags && item.tags.length > 0 && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 24,
              }}>
                {item.tags.slice(0, 3).map((tag, tagIndex) => (
                  <View
                    key={`${item.id}-tag-${tag}-${tagIndex}`}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      borderRadius: 28,
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderWidth: 2,
                      borderColor: 'rgba(255,255,255,0.5)',
                      shadowColor: 'rgba(255,255,255,0.4)',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.6,
                      shadowRadius: 12,
                      elevation: 8,
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: 26,
                      }}
                    />
                    <Text style={{
                      color: 'white',
                      fontSize: 16,
                      fontWeight: '800',
                      textShadowColor: 'rgba(0,0,0,0.5)',
                      textShadowOffset: { width: 0, height: 2 },
                      textShadowRadius: 4,
                      letterSpacing: 0.8,
                    }}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 心情状态 */}
            {item.mood && (
              <View style={{
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <View style={{
                  backgroundColor: 'rgba(135, 206, 250, 1)',
                  borderRadius: 20,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderWidth: 3,
                  borderColor: 'rgba(255,255,255,0.5)',
                  shadowColor: 'rgba(135, 206, 250, 0.8)',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.8,
                  shadowRadius: 12,
                  elevation: 10,
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 16,
                    fontWeight: '900',
                    textShadowColor: 'rgba(0,0,0,0.4)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 3,
                    letterSpacing: 0.5,
                  }}>
                    {(() => {
                      const mood = moods.find(m => m.value.trim() === item.mood?.trim());
                      return mood ? `${mood.emoji} ${mood.label}` : item.mood;
                    })()}
                  </Text>
                </View>
              </View>
            )}

            {/* 时间戳 */}
            <Text style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 14,
              textAlign: 'center',
              fontWeight: '600',
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}>
              {timeAgo(item.createdAt)}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default PremiumPostCard;

// 高级主页组件
export const PremiumHomeScreen = ({ navigation, route }) => {
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
  const [shouldShowDailyTaskAnimation, setShouldShowDailyTaskAnimation] = useState(false);

  const { user, isLoggedIn } = useUser();

  // 背景动画
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 背景渐变动画
    const backgroundAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: false,
        }),
        Animated.timing(backgroundAnim, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: false,
        }),
      ])
    );

    // 头部动画
    const headerAnimation = Animated.loop(
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: false,
      })
    );

    backgroundAnimation.start();
    headerAnimation.start();

    return () => {
      backgroundAnimation.stop();
      headerAnimation.stop();
    };
  }, []);

  // 检查每日任务状态
  const checkDailyTaskStatus = async () => {
    if (!isLoggedIn || !user) return;

    try {
      const today = new Date().toDateString();
      const completedToday = await AsyncStorage.getItem(`dailyTask_completed_${today}`);
      const dismissedToday = await AsyncStorage.getItem(`dailyTask_dismissed_${today}`);
      const lastShownDate = await AsyncStorage.getItem('dailyTask_lastShown');

      if (completedToday || dismissedToday || lastShownDate === today) return;

      const now = new Date();
      const hour = now.getHours();
      if (hour < 8) return;

      try {
        const notificationsResponse = await getNotifications(1, 20);
        if (notificationsResponse.success) {
          const todayTaskNotification = notificationsResponse.data.notifications.find(n => {
            if (n.type !== 'daily_task') return false;
            if (!n.data) return false;

            try {
              const data = JSON.parse(n.data);
              return data.date === today && !n.is_read;
            } catch (e) {
              return false;
            }
          });

          if (todayTaskNotification) {
            setShouldShowDailyTaskAnimation(true);
            await AsyncStorage.setItem('dailyTask_lastShown', today);
          }
        }
      } catch (error) {
        console.error('获取通知异常:', error);
      }
    } catch (error) {
      console.error('检查每日任务状态失败:', error);
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

  const handleUserPress = (userId) => {
    navigation.navigate('UserProfile', { userId: userId });
  };

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

  const handleTaskPress = (taskData) => {
    setShouldShowDailyTaskAnimation(false);
    navigation.navigate('Create', {
      taskData: taskData,
      fromDailyTask: true
    });
  };

  const handleTaskDismiss = () => {
    setShouldShowDailyTaskAnimation(false);
  };

  useEffect(() => {
    loadPosts(1, false);
  }, []);

  useEffect(() => {
    if (isLoggedIn && user) {
      setTimeout(() => {
        checkDailyTaskStatus();
      }, 1500);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    const sub = navigation.addListener('focus', () => {
      if (route?.params?.shouldRefresh) {
        loadPosts(1, false);
        navigation.setParams({ shouldRefresh: undefined });
      }

      if (isLoggedIn && user) {
        setTimeout(() => {
          checkDailyTaskStatus();
        }, 500);
      }
    });
    return sub;
  }, [navigation, route?.params?.shouldRefresh, isLoggedIn, user]);

  // 动态背景色
  const backgroundColors = backgroundAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      '#E6E6FA', // 淡紫色
      '#DDA0DD', // 梅红色
      '#DA70D6', // 兰花紫
      '#BA55D3', // 中兰花紫
      '#9370DB'  // 中紫色
    ],
  });

  const headerOpacity = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <View style={{ flex: 1, paddingTop: 30 }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 动态背景渐变 */}
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}>
        <LinearGradient
          colors={['#E6E6FA', '#DDA0DD', '#DA70D6', '#BA55D3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
        {/* 动态覆盖层 */}
        <Animated.View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: backgroundColors,
          opacity: 0.3,
        }} />
      </Animated.View>

      {/* 装饰性粒子效果 */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
      }}>
        {[...Array(12)].map((_, index) => (
          <Animated.View
            key={index}
            style={{
              position: 'absolute',
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.4)',
              left: `${10 + (index * 8) % 80}%`,
              top: `${5 + (index * 12) % 90}%`,
              transform: [{
                translateY: backgroundAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, index % 2 === 0 ? -20 : 20],
                })
              }],
              opacity: backgroundAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 0.8, 0.2],
              }),
            }}
          />
        ))}
      </View>

      <SafeAreaView style={{ flex: 1, zIndex: 2 }}>
        {loading && posts.length === 0 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(255,255,255,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
              shadowColor: 'rgba(255,255,255,0.8)',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.6,
              shadowRadius: 16,
              elevation: 12,
            }}>
              <ActivityIndicator size="large" color="white" />
            </View>
            <Text style={{
              color: 'white',
              fontSize: 20,
              fontWeight: '700',
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            }}>
              正在加载精彩内容...
            </Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingBottom: 140,
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
            ListHeaderComponent={() => (
              <Animated.View style={{
                paddingTop: 30,
                paddingHorizontal: 24,
                paddingBottom: 32,
                alignItems: 'center',
                opacity: headerOpacity,
              }}>
                {isLoggedIn && user && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Profile')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.35)',
                      borderRadius: 28,
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      marginBottom: 32,
                      borderWidth: 2,
                      borderColor: 'rgba(255,255,255,0.5)',
                      shadowColor: 'rgba(255,255,255,0.6)',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.6,
                      shadowRadius: 16,
                      elevation: 12,
                    }}
                  >
                    <Avatar
                      uri={user.avatar}
                      name={user.name}
                      size={36}
                      style={{ 
                        marginRight: 12,
                        borderWidth: 2,
                        borderColor: 'rgba(255,255,255,0.8)',
                      }}
                    />
                    <Text style={{
                      color: 'white',
                      fontSize: 18,
                      fontWeight: '800',
                      textShadowColor: 'rgba(0,0,0,0.4)',
                      textShadowOffset: { width: 0, height: 2 },
                      textShadowRadius: 3,
                      letterSpacing: 0.5,
                    }}>
                      {user.name}
                    </Text>
                  </TouchableOpacity>
                )}

                <Text style={{
                  fontSize: 42,
                  fontWeight: '100',
                  color: 'white',
                  textAlign: 'center',
                  marginBottom: 12,
                  textShadowColor: 'rgba(0,0,0,0.3)',
                  textShadowOffset: { width: 0, height: 4 },
                  textShadowRadius: 12,
                  letterSpacing: 2,
                }}>
                  Premium
                </Text>
                <Text style={{
                  fontSize: 28,
                  fontWeight: '300',
                  color: 'rgba(255,255,255,0.9)',
                  textAlign: 'center',
                  textShadowColor: 'rgba(0,0,0,0.2)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 8,
                  letterSpacing: 1,
                }}>
                  Moments ✨
                </Text>
              </Animated.View>
            )}
            renderItem={({ item, index }) => (
              <View style={{ paddingHorizontal: 20 }}>
                <PremiumPostCard
                  item={item}
                  onOpenComments={openComments}
                  onOpenImage={openImageViewer}
                  onUserPress={handleUserPress}
                  onPress={handleCardPress}
                  navigation={navigation}
                  index={index}
                />
              </View>
            )}
            ListFooterComponent={() => {
              if (loadingMore) {
                return (
                  <View style={{
                    paddingVertical: 32,
                    alignItems: 'center'
                  }}>
                    <View style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: 'rgba(255,255,255,0.6)',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.6,
                      shadowRadius: 8,
                      elevation: 8,
                    }}>
                      <ActivityIndicator size="small" color="white" />
                    </View>
                  </View>
                );
              }

              if (!hasMore && posts.length > 0) {
                return (
                  <View style={{
                    paddingVertical: 32,
                    alignItems: 'center'
                  }}>
                    <View style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.3)',
                    }}>
                      <Text style={{
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 14,
                        fontWeight: '600',
                      }}>
                        已经到底了 ✨
                      </Text>
                    </View>
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
                paddingVertical: 80,
                paddingHorizontal: 32,
              }}>
                <View style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 32,
                  shadowColor: 'rgba(255,255,255,0.8)',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.6,
                  shadowRadius: 20,
                  elevation: 15,
                }}>
                  <Text style={{ fontSize: 48 }}>✨</Text>
                </View>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: 12,
                  textShadowColor: 'rgba(0,0,0,0.4)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                }}>
                  等待第一个精彩时刻
                </Text>
                <Text style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 16,
                  textAlign: 'center',
                  lineHeight: 24,
                  fontWeight: '500',
                }}>
                  成为第一个分享美好的人
                </Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>

      {/* 图片查看器 */}
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

      {/* 评论抽屉 */}
      <CommentsDrawer
        visible={commentsDrawerVisible}
        onClose={() => setCommentsDrawerVisible(false)}
        post={selectedPost}
        onUpdateCommentCount={(postId, newCount) => {
          setPosts(prevPosts =>
            prevPosts.map(post =>
              post.id === postId
                ? { ...post, comments_count: newCount }
                : post
            )
          );
        }}
      />

      {/* 每日任务动画 */}
      <DailyTaskCardWithAnimation
        visible={shouldShowDailyTaskAnimation}
        onPress={handleTaskPress}
        onDismiss={handleTaskDismiss}
      />
    </View>
  );
};
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
import { getAllPosts, getPostCommentsCount, getNotifications, createMark, removeMark, checkMarkStatus } from '../services/onlineOnlyStorage';
import { useUser } from '../contexts/UserContext';
import { useToastContext } from '../contexts/ToastContext';
import { SERVER_BASE_URL } from '../config/env';
import CommentsDrawer from '../components/CommentsDrawer';
import ImageViewer from 'react-native-image-zoom-viewer';
import { useFocusEffect } from '@react-navigation/native';
import { moods } from '../theme/moods';
import { gradients } from '../theme/postsColor';
import { color } from 'motion';

const { width, height } = Dimensions.get('window');

// 优化mark状态缓存
const markStatusCache = new Map();
const CACHE_DURATION = 60000; // 增加到60秒缓存
const MAX_CONCURRENT_REQUESTS = 3; // 最大并发请求数
let currentRequests = 0;

// 时间格式化函数
const timeAgo = (ts) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  // return `${days} 天前`;
  const date = new Date(ts);
  const localDate = date.toLocaleDateString();
  const localtime = date.toLocaleTimeString();
  return localDate;
};

// 高级渐变色方案 - 温暖色调
const premiumGradients = [
  // 温暖日落系
  ['#FF6B6B', '#FF8E53', '#FF6B9D'],
  ['#F59E0B', '#F97316', '#FB923C'],

  // 自然绿意系
  ['#10B981', '#34D399', '#6EE7B7'],
  ['#84CC16', '#A3E635', '#BEF264'],

  // 优雅粉调系
  ['#EC4899', '#F472B6', '#F9A8D4'],
  ['#F472B6', '#FBBF24', '#FDE047'],

  // 珊瑚橙系
  ['#FF7849', '#FF9F43', '#FFC947'],
  ['#FF6B35', '#F7931E', '#FFD23F'],

  // 薄荷绿系
  ['#00D4AA', '#5DADE2', '#48CAE4'],
  ['#26D0CE', '#1ABC9C', '#16A085'],
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

// 保留原始PostCard组件以兼容其他地方的使用
export const PostCard = ({ item, onOpenComments, onOpenImage, onUserPress, onPress, showComments = true }) => {

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

// 高级卡片组件
const PremiumPostCard = ({ item, onOpenComments, onOpenImage, onUserPress, onPress, onMark, navigation, index = 0, currentUserId, showError }) => {
  const hasImage = item.images && item.images.length > 0;
  const contentLength = item.content?.length || 0;

  // 检查是否是自己的帖子
  const isOwnPost = currentUserId && item.author.id === currentUserId;

  // Mark状态
  const [isMarked, setIsMarked] = useState(false);
  const [markLoading, setMarkLoading] = useState(false);

  // 动画值
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Mark按钮动画
  const markScaleAnim = useRef(new Animated.Value(1)).current;

  // 优化后的mark状态检查
  useEffect(() => {
    const checkMark = async () => {
      try {
        // 检查缓存
        const cacheKey = `mark_${item.id}`;
        const cached = markStatusCache.get(cacheKey);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          setIsMarked(cached.isMarked);
          return;
        }

        // 限制并发请求数
        if (currentRequests >= MAX_CONCURRENT_REQUESTS) {
          // 如果并发请求过多，延迟执行
          const delay = 2000 + Math.random() * 3000;
          setTimeout(checkMark, delay);
          return;
        }

        currentRequests++;
        
        // 添加随机延迟，避免同时发送大量请求
        const delay = Math.random() * 2000 + (index * 200);
        await new Promise(resolve => setTimeout(resolve, delay));

        const response = await checkMarkStatus(item.id);
        if (response.success) {
          const isMarked = response.data.isMarked;
          setIsMarked(isMarked);
          // 更新缓存
          markStatusCache.set(cacheKey, {
            isMarked,
            timestamp: now
          });
        }
      } catch (error) {
        console.error('检查mark状态失败:', error);
        // 如果是频率限制错误，设置更长的延迟后重试
        if (error.message?.includes('频繁') || error.response?.status === 429) {
          const retryDelay = 15000 + Math.random() * 15000; // 15-30秒随机延迟
          setTimeout(() => {
            checkMark();
          }, retryDelay);
        }
      } finally {
        currentRequests--;
      }
    };

    // 添加初始延迟，错开请求时间
    const timer = setTimeout(checkMark, index * 500 + Math.random() * 1000);
    return () => clearTimeout(timer);
  }, [item.id, index]);

  // 处理mark点击
  const handleMarkPress = async () => {
    if (markLoading) return;

    setMarkLoading(true);

    // 简单的点击动画
    Animated.sequence([
      Animated.spring(markScaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 400,
        friction: 8,
      }),
      Animated.spring(markScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 400,
        friction: 8,
      })
    ]).start();

    try {
      if (isMarked) {
        const response = await removeMark(item.id);
        if (response.success) {
          setIsMarked(false);
          onMark && onMark(item.id, false);
          // 更新缓存
          markStatusCache.set(`mark_${item.id}`, {
            isMarked: false,
            timestamp: Date.now()
          });
        }
      } else {
        const response = await createMark(item.id);
        if (response.success) {
          setIsMarked(true);
          onMark && onMark(item.id, true);
          // 更新缓存
          markStatusCache.set(`mark_${item.id}`, {
            isMarked: true,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('Mark操作失败:', error);
      // 如果已经标记过，直接设置为已标记状态
      if (error.response?.status === 409) {
        setIsMarked(true);
        onMark && onMark(item.id, true);
        // 更新缓存
        markStatusCache.set(`mark_${item.id}`, {
          isMarked: true,
          timestamp: Date.now()
        });
      } else if (error.response?.status === 403) {
        // 不能标记自己的帖子
        showError('不能标记自己的帖子');
      } else if (error.message?.includes('频繁') || error.response?.status === 429) {
        // 频率限制错误，显示提示
        showError('操作过于频繁，请稍后再试');
      }
    } finally {
      setMarkLoading(false);
    }
  };

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
    glowAnimation.start();
    rotateAnimation.start();

    return () => {
      floatAnimation.stop();
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



  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const rotateZ = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // 动态卡片高度 - 增加高度确保内容完整显示
  const cardHeight = hasImage ? 520 : (contentLength > 100 ? 460 : 400);
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
      elevation: 8, // 降低elevation，避免覆盖导航栏
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
        zIndex: 0, // 保持在底层
      }}>
        <LinearGradient
          colors={[`${gradientColors[0]}40`, `${gradientColors[1]}20`, 'transparent']}
          style={{
            flex: 1,
            borderRadius: 40,
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
              height: 300,
            }}
          />

          {/* 顶部区域显示发布时间和mark按钮 */}
          <View style={{
            position: 'absolute',
            top: 5,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingVertical: 6,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {/* 发布时间 */}
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
            {/* 只在不是自己的帖子时显示标记按钮 */}
            {!isOwnPost && (
              <Pressable
                onPress={handleMarkPress}
                disabled={markLoading}
              >
                <Animated.View style={{
                  transform: [{ scale: markScaleAnim }],
                  opacity: markLoading ? 0.6 : 1,
                }}>
                  <View style={{
                    backgroundColor: isMarked ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255,255,255,0.1)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isMarked ? 'rgba(255, 107, 53, 0.4)' : 'rgba(255,255,255,0.3)',
                  }}>
                    {markLoading ? (
                      <ActivityIndicator size="small" color="rgba(255,255,255,0.9)" />
                    ) : (
                      <Text
                        style={{
                          color: isMarked ? '#FF6B35' : 'rgba(255,255,255,0.9)',
                          fontSize: 14,
                          fontWeight: '600',
                          textShadowColor: 'rgba(0,0,0,0.5)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        }}
                      >
                        {isMarked ? '🧡 已标记' : '🤍 标记'}
                      </Text>
                    )}
                  </View>
                </Animated.View>
              </Pressable>
            )}
          </View>

          {/* 内容区域 */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 24, // 减少内边距
          }}>
            {/* 头像区域 */}
            <View style={{
              alignItems: 'center',
              marginBottom: 16, // 减少间距
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
                      width: 72, // 减小头像尺寸
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 3,
                      borderColor: 'rgba(255,255,255,0.6)',
                    }}>
                      <Avatar
                        uri={item.author.avatar}
                        name={item.author.name}
                        size={64}
                        style={{
                          borderWidth: 3,
                          borderColor: 'rgba(255,255,255,1)',
                        }}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={{
                  width: 72, // 减小匿名头像尺寸
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: 'rgba(255,255,255,0.4)',
                }}>
                  <Ionicons name="person" size={32} color="rgba(255,255,255,0.9)" />
                </View>
              )}
            </View>

            {/* 用户名 */}
            <Text style={{
              fontSize: 24, // 减小字号
              fontWeight: '800',
              color: 'white',
              textAlign: 'center',
              marginBottom: 12, // 减少间距
              letterSpacing: 1,
              lineHeight: 28,
            }}>
              {item.author.name || '匿名用户'}
            </Text>

            {/* 内容预览 */}
            {!hasImage && item.content && (
              <View style={{
                borderRadius: 20,
                paddingHorizontal: 20,
                paddingVertical: 16,
                marginBottom: 16,
              }}>
                <Text style={{
                  fontSize: 16,
                  color: 'rgba(255,255,255,1)',
                  textAlign: 'center',
                  lineHeight: 22,
                  fontWeight: '600',
                  letterSpacing: 0.3,
                }} numberOfLines={4}>
                  {item.content.length > 30 ? item.content.slice(0, 30) + "..." : item.content}
                </Text>
              </View>
            )}

            {/* 标签云 - 优化多标签显示 */}
            {item.tags && item.tags.length > 0 && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 20,
                maxWidth: '100%',
              }}>
                {item.tags.slice(0, 6).map((tag, tagIndex) => (
                  <View
                    key={`${item.id}-tag-${tag}-${tagIndex}`}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.4)',
                      shadowColor: 'rgba(255,255,255,0.3)',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.4,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Text style={{
                      color: 'white',
                      fontSize: 12,
                      fontWeight: '600',
                      textShadowColor: 'rgba(0,0,0,0.4)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}>
                      #{tag}
                    </Text>
                  </View>
                ))}
                {item.tags.length > 6 && (
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}>
                    <Text style={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                      +{item.tags.length - 6}
                    </Text>
                  </View>
                )}
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

            {/* 底部展示这篇帖子的mark数量 */}
            {item.marks_count !== 0 && (
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  marginBottom: 5
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    color: '#3CB371'
                  }}
                >
                  👏 {item.marks_count} 人mark了这篇帖子
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
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
  const [lastLoadTime, setLastLoadTime] = useState(0);

  const { user, isLoggedIn } = useUser();
  const { showSuccess, showError } = useToastContext();

  // 防抖和节流配置
  const MIN_REFRESH_INTERVAL = 3000; // 最小刷新间隔3秒
  const FOCUS_DEBOUNCE_DELAY = 1000; // 焦点防抖延迟1秒

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
      // 防止重复加载
      if (loading || (pageNum === 1 && refreshing)) return;
      
      const now = Date.now();
      if (pageNum === 1 && (now - lastLoadTime) < MIN_REFRESH_INTERVAL) {
        console.log('请求过于频繁，跳过加载');
        return;
      }

      if (pageNum === 1) {
        setLoading(true);
        setLastLoadTime(now);
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
      if (error.message?.includes('频繁') || error.response?.status === 429) {
        showError('请求过于频繁，请稍后再试');
      }
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



  useEffect(() => {
    loadPosts(1, false);
  }, []);



  // 优化后的页面焦点监听
  useEffect(() => {
    let timeoutId;
    
    const sub = navigation.addListener('focus', () => {
      if (route?.params?.shouldRefresh) {
        // 清除之前的延时
        if (timeoutId) clearTimeout(timeoutId);
        
        // 添加防抖延迟
        timeoutId = setTimeout(() => {
          const now = Date.now();
          if ((now - lastLoadTime) > MIN_REFRESH_INTERVAL) {
            loadPosts(1, false);
          }
        }, FOCUS_DEBOUNCE_DELAY);
        
        navigation.setParams({ shouldRefresh: undefined });
      }
    });
    
    return () => {
      sub();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigation, route?.params?.shouldRefresh, lastLoadTime]);

  // 动态背景色 - 温暖色调
  const backgroundColors = backgroundAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      '#FFE5B4', // 桃色
      '#FFCCCB', // 浅粉色
      '#FFB6C1', // 淡粉色
      '#FFA07A', // 浅鲑鱼色
      '#FF7F50'  // 珊瑚色
    ],
  });

  const headerOpacity = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  //处理mark状态变化
  const handleMark = (postId, isMarked) => {
    if (isMarked) {
      showSuccess('已添加到我的标记 ✨');
    } else {
      showSuccess('已取消标记');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 动态背景渐变 - 温暖色调 */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}>
        <LinearGradient
          colors={['#FFE5B4', '#FFCCCB', '#FFB6C1', '#FFA07A']}
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
          opacity: 0.2,
        }} />
      </View>

      {/* 装饰性粒子效果 */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1, // 设置为负值，确保在最底层
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

      <SafeAreaView style={{ flex: 1 }}>
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
              paddingBottom: 100, // 为底部导航栏留出空间
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
                paddingTop: 60, // 增加顶部间距，为状态栏留出空间
                paddingHorizontal: 24,
                paddingBottom: 20,
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
                      marginBottom: 20,
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
                  fontSize: 36,
                  fontWeight: '200',
                  color: 'white',
                  textAlign: 'center',
                  marginBottom: 8,
                  textShadowColor: 'rgba(0,0,0,0.3)',
                  textShadowOffset: { width: 0, height: 3 },
                  textShadowRadius: 8,
                  letterSpacing: 1.5,
                }}>
                  Premium
                </Text>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '300',
                  color: 'rgba(255,255,255,0.9)',
                  textAlign: 'center',
                  textShadowColor: 'rgba(0,0,0,0.2)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 6,
                  letterSpacing: 0.8,
                }}>
                  Moments ☀️
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
                  onMark={handleMark}
                  currentUserId={user?.id}
                  showError={showError}
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


    </View>
  );
};
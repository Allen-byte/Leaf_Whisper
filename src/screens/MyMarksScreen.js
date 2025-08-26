import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { getUserMarks, removeMark } from '../services/onlineOnlyStorage';
import { useUser } from '../contexts/UserContext';
import { useToastContext } from '../contexts/ToastContext';
import { SERVER_BASE_URL } from '../config/env';
import ImageViewer from 'react-native-image-zoom-viewer';
import { moods } from '../theme/moods';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // 两列布局，考虑边距

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

// 高级渐变色方案
const premiumGradients = [
  ['#FF6B6B', '#FF8E53', '#FF6B9D'],
  ['#F59E0B', '#F97316', '#FB923C'],
  ['#10B981', '#34D399', '#6EE7B7'],
  ['#84CC16', '#A3E635', '#BEF264'],
  ['#EC4899', '#F472B6', '#F9A8D4'],
  ['#F472B6', '#FBBF24', '#FDE047'],
  ['#FF7849', '#FF9F43', '#FFC947'],
  ['#FF6B35', '#F7931E', '#FFD23F'],
  ['#00D4AA', '#5DADE2', '#48CAE4'],
  ['#26D0CE', '#1ABC9C', '#16A085'],
];

// 获取智能渐变色
const getSmartGradient = (postId, hasImage) => {
  const baseIndex = postId % premiumGradients.length;
  return premiumGradients[baseIndex];
};

// 标记卡片组件 - 画廊风格
const MarkCard = ({ item, onPress, onRemoveMark, onOpenImage, index }) => {
  const hasImage = item.images && item.images.length > 0;
  const gradientColors = getSmartGradient(item.id, hasImage);
  
  // 动画值
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [removeLoading, setRemoveLoading] = useState(false);

  // 浮动动画
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000 + (index * 200),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000 + (index * 200),
          useNativeDriver: true,
        }),
      ])
    );

    floatAnimation.start();
    return () => floatAnimation.stop();
  }, []);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const handleRemoveMark = async () => {
    if (removeLoading) return;
    
    setRemoveLoading(true);
    try {
      await onRemoveMark(item.id);
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <Animated.View style={{
      width: cardWidth,
      marginBottom: 20,
      transform: [
        { translateY: floatY },
        { rotate: index % 3 === 0 ? '2deg' : index % 3 === 1 ? '-1deg' : '0.5deg' },
      ],
      shadowColor: hasImage ? 'rgba(0,0,0,0.3)' : gradientColors[0],
      shadowOffset: { width: 0, height: 15 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 6,
    }}>
      <Pressable
        onPress={() => onPress(item.id)}
        onPressIn={() => {
          Animated.spring(scaleAnim, {
            toValue: 0.95,
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
            borderRadius: 24,
            overflow: 'hidden',
            height: 280,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.3)',
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

          {/* 毛玻璃层 */}
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
              'transparent'
            ]}
            locations={[0, 0.3, 1]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 80,
            }}
          />

          {/* 取消标记按钮 */}
          <View style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 2,
          }}>
            <Pressable
              onPress={handleRemoveMark}
              disabled={removeLoading}
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderRadius: 16,
                padding: 8,
                opacity: removeLoading ? 0.5 : 1,
              }}
            >
              {removeLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="heart-dislike" size={16} color="white" />
              )}
            </Pressable>
          </View>

          {/* 标记时间 */}
          <View style={{
            position: 'absolute',
            top: 12,
            left: 12,
          }}>
            <Text style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 11,
              fontWeight: '600',
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}>
              {timeAgo(item.markedAt)}
            </Text>
          </View>

          {/* 内容区域 */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
          }}>
            {/* 用户名 */}
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: 'white',
              textAlign: 'center',
              marginBottom: 8,
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}>
              {item.author.name || '匿名用户'}
            </Text>

            {/* 内容预览 */}
            <Text style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center',
              lineHeight: 16,
              marginBottom: 8,
              textShadowColor: 'rgba(0,0,0,0.3)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 1,
            }} numberOfLines={3}>
              {item.content.length > 60 ? item.content.slice(0, 60) + "..." : item.content}
            </Text>

            {/* 心情状态 */}
            {item.mood && (
              <View style={{
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
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
                gap: 4,
              }}>
                {item.tags.slice(0, 2).map((tag, tagIndex) => (
                  <View
                    key={`${item.id}-tag-${tag}-${tagIndex}`}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <Text style={{
                      color: 'white',
                      fontSize: 9,
                      fontWeight: '500',
                    }}>
                      #{tag}
                    </Text>
                  </View>
                ))}
                {item.tags.length > 2 && (
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}>
                    <Text style={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: 9,
                      fontWeight: '500',
                    }}>
                      +{item.tags.length - 2}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export const MyMarksScreen = ({ navigation }) => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerImages, setViewerImages] = useState([]);

  const { user, isLoggedIn } = useUser();
  const { showSuccess, showError } = useToastContext();

  useEffect(() => {
    if (isLoggedIn) {
      loadMarks(1, false);
    }
  }, [isLoggedIn]);

  const loadMarks = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getUserMarks(pageNum, 20);

      if (response.success) {
        const { posts: newMarks, hasMore: hasMoreData } = response.data;

        if (append) {
          setMarks(prev => [...prev, ...newMarks]);
        } else {
          setMarks(newMarks);
        }

        setHasMore(hasMoreData);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('加载标记失败:', error);
      showError('加载标记失败');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMarks(1, false);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadMarks(page + 1, true);
    }
  };

  const handleRemoveMark = async (postId) => {
    try {
      const response = await removeMark(postId);
      if (response.success) {
        setMarks(prev => prev.filter(mark => mark.id !== postId));
        showSuccess('已取消标记');
      }
    } catch (error) {
      console.error('取消标记失败:', error);
      showError('取消标记失败');
    }
  };

  const handleCardPress = (postId) => {
    navigation.navigate('PostDetail', { postId });
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

  const renderMarkCard = ({ item, index }) => (
    <MarkCard
      item={item}
      index={index}
      onPress={handleCardPress}
      onRemoveMark={handleRemoveMark}
      onOpenImage={openImageViewer}
    />
  );

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: COLORS.text,
            marginBottom: 8,
            textAlign: 'center',
          }}>
            请先登录
          </Text>
          <Text style={{
            color: COLORS.textMuted,
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 20,
          }}>
            登录后即可查看您的标记收藏
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={{
              backgroundColor: COLORS.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 20,
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
            }}>
              去登录
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface, paddingTop: 30 }}>
        {/* 头部 */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.borderLight,
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
              fontSize: 20,
              fontWeight: '700',
              color: COLORS.text,
            }}>
              我的标记
            </Text>
            <Text style={{
              fontSize: 14,
              color: COLORS.textMuted,
              marginTop: 2,
            }}>
              {marks.length} 个标记
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{
              color: COLORS.textMuted,
              fontSize: 16,
              marginTop: 12,
            }}>
              正在加载...
            </Text>
          </View>
        ) : marks.length === 0 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>📌</Text>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: COLORS.text,
              marginBottom: 8,
              textAlign: 'center',
            }}>
              还没有标记任何内容
            </Text>
            <Text style={{
              color: COLORS.textMuted,
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 20,
            }}>
              在首页点击"标记"按钮收藏喜欢的帖子
            </Text>
          </View>
        ) : (
          <FlatList
            data={marks}
            renderItem={renderMarkCard}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: 'space-between',
              paddingHorizontal: 20,
            }}
            contentContainerStyle={{
              paddingTop: 20,
              paddingBottom: 100,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={() => (
              loadingMore ? (
                <View style={{
                  paddingVertical: 20,
                  alignItems: 'center',
                }}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : null
            )}
          />
        )}
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
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { COLORS } from '../theme/colors';
import { getUserComments, getPostById } from '../services/onlineOnlyStorage';
import { Ionicons } from '@expo/vector-icons';
import { deleteComment } from '../services/onlineOnlyStorage';
import { useToastContext } from '../contexts/ToastContext';
import { SERVER_BASE_URL } from '../config/env';
import { PostCard } from "./HomeScreen";
import { moods } from '../theme/moods';


const { width, height } = Dimensions.get('window');

// 美化的评论卡片组件
const MyCommentCard = ({ item, onDelete, index, onPress }) => {
  const post = item.post;
  const [isExpanded, setIsExpanded] = useState(false);

  const timeAgo = (ts) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} 小时前`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} 天前`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} 个月前`;
    const years = Math.floor(months / 12);
    return `${years} 年前`;
  };

  return (
    <Animated.View
      style={{
        marginBottom: 20,
        opacity: 1,
        transform: [{ translateY: 0 }],
      }}
    >
      <View
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: 20,
          padding: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 6,
          borderWidth: 1,
          borderColor: COLORS.borderLight,
          overflow: 'hidden',
        }}
      >
        {/* 评论头部信息 */}
        <View style={{
          backgroundColor: COLORS.primaryLight + '20',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.borderLight,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
            }}>
              <View style={{
                backgroundColor: COLORS.primary,
                borderRadius: 12,
                padding: 8,
                marginRight: 12,
              }}>
                <Ionicons name="chatbubble" size={16} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: COLORS.text,
                  fontSize: 15,
                  fontWeight: '700',
                  marginBottom: 2,
                }}>
                  我的评论
                </Text>
                <Text style={{
                  color: COLORS.textMuted,
                  fontSize: 12,
                  fontWeight: '500',
                }}>
                  {timeAgo(item.createdAt)}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => onDelete(item.post.id, item.id)}
              style={{
                backgroundColor: COLORS.error + '20',
                borderRadius: 10,
                padding: 8,
              }}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            </Pressable>
          </View>
        </View>

        {/* 评论内容区域 */}
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}>
          <View style={{
            backgroundColor: COLORS.bg,
            borderRadius: 16,
            padding: 16,
            borderLeftWidth: 4,
            borderLeftColor: COLORS.primary,
            marginBottom: 16,
          }}>
            <Text style={{
              color: COLORS.text,
              fontSize: 15,
              lineHeight: 22,
              letterSpacing: 0.2,
            }}>
              {item.comment_content}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onPress(item.post.id)}
            activeOpacity={0.8}>
            {/* 原帖预览 */}
            <View style={{
              backgroundColor: COLORS.bgLight,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.borderLight,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color={COLORS.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={{
                  color: COLORS.textMuted,
                  fontSize: 13,
                  fontWeight: '600',
                }}>
                  评论的帖子
                </Text>
              </View>

              {/* 帖子作者信息 */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <Avatar
                  uri={post.author?.avatar}
                  name={post.author?.name || '匿名用户'}
                  size={32}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: COLORS.text,
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                    {post.author?.name || '匿名用户'}
                  </Text>
                  <Text style={{
                    color: COLORS.textMuted,
                    fontSize: 12,
                  }}>
                    {timeAgo(post.createdAt)}
                  </Text>
                </View>
              </View>

              {/* 帖子内容预览 */}
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 14,
                  lineHeight: 20,
                  marginBottom: 12,
                }}
                numberOfLines={isExpanded ? undefined : 3}
              >
                {post.content}
              </Text>

              {/* 展开/收起按钮 */}
              {post.content && post.content.length > 100 && (
                <Pressable
                  onPress={() => setIsExpanded(!isExpanded)}
                  style={{
                    alignSelf: 'flex-start',
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{
                    color: COLORS.primary,
                    fontSize: 13,
                    fontWeight: '600',
                  }}>
                    {isExpanded ? '收起' : '展开'}
                  </Text>
                </Pressable>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export const MyCommentsScreen = ({ navigation }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showConfirm, showError, showSuccess } = useToastContext();

  useEffect(() => {
    loadMyComments();
  }, []);

  const loadMyComments = async () => {
    try {
      setLoading(true);
      const response = await getUserComments();

      const processedComments = (response.data || []).map(comment => ({
        ...comment,
        post: {
          ...comment.post,
          images: Array.isArray(comment.post.images)
            ? comment.post.images.map((uri, index) => ({
              id: `img_${comment.post.id}_${index}`,
              uri: uri
            }))
            : []
        }
      }));

      setComments(processedComments);
    } catch (error) {
      console.error('加载我的评论失败:', error);
      showError('加载评论失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (postId, commentId) => {
    showConfirm({
      title: '删除评论',
      message: '确定要删除这条评论吗？删除后无法恢复。',
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: async () => {
        try {
          // 这里不再有 setLoading
          await deleteComment(postId, commentId);
          setComments(prev => prev.filter(c => c.id !== commentId));
          showSuccess('评论删除成功');
        } catch (error) {
          console.error('删除评论失败:', error);
          showError('删除评论失败');
        }
        // 这里不再有 finally 和 setLoading
      },
      onCancel: () => {
        // 保持为空
      }
    });
  };

  const renderEmptyState = () => (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      backgroundColor: COLORS.bg,
      minHeight: 300
    }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8
      }}>
        还没有评论
      </Text>
      <Text style={{
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: 24
      }}>
        快去发表你的第一条评论吧
      </Text>
      <Button
        title="去社区"
        variant="primary"
        onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
      />
    </View>
  );

  //处理卡片点击，进入详情页
  const handleCardPress = (postId) => {
    navigation.navigate('PostDetail', { postId: postId });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.bg
        }}>
          <Text style={{
            fontSize: 16,
            color: COLORS.textMuted,
            marginTop: 16
          }}>
            加载中...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: 40, backgroundColor: COLORS.bg }}>
      <LinearGradient
        colors={COLORS.cardGradient}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 20,
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 20,
        }}
      >
        <Pressable
          style={({ pressed }) => ({
            padding: 8,
            borderRadius: 12,
            backgroundColor: COLORS.bg,
            marginRight: 16,
          })}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: COLORS.text,
            marginBottom: 4,
          }}>
            我的评论
          </Text>
        </View>

        <View style={{
          backgroundColor: COLORS.primaryLight,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
        }}>
          <Text style={{
            color: COLORS.text,
            fontSize: 12,
            fontWeight: '600',
          }}>
            {comments.length}
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
          flexGrow: 1
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item, index }) => (
          <MyCommentCard
            item={item}
            index={index}
            onDelete={handleDelete}
            onPress={handleCardPress}
          />
        )}
      />
    </SafeAreaView>
  );
};
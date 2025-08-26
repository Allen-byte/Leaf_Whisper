import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { COLORS } from '../theme/colors';
import { getPostComments, createComment } from '../services/onlineOnlyStorage';
import { useUser } from '../contexts/UserContext';
import { useToastContext } from '../contexts/ToastContext';
import { Ionicons } from '@expo/vector-icons';

const CommentsSection = ({ post, initiallyExpanded = false }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  
  const { user, isLoggedIn } = useUser();
  const { showError, showSuccess } = useToastContext();
  const animatedHeight = new Animated.Value(0);

  const limit = 20;

  // 时间格式化函数
  const timeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
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

  // 切换展开/收起
  const toggleExpanded = () => {
    setExpanded(!expanded);
    if (!expanded && comments.length === 0) {
      loadComments();
    }
  };

  // 加载评论
  const loadComments = async (pageNum = 1, append = false) => {
    if (!post?.id) return;
    
    try {
      setLoading(true);
      const response = await getPostComments(post.id, pageNum, limit);
      
      if (response.success) {
        const { comments: newComments, total: totalCount, hasMore: hasMoreData } = response.data;
        
        if (append) {
          setComments(prev => [...prev, ...newComments]);
        } else {
          setComments(newComments);
        }
        
        setTotal(totalCount);
        setHasMore(hasMoreData);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      showError('加载评论失败');
    } finally {
      setLoading(false);
    }
  };

  // 提交评论
  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      showError('请输入评论内容');
      return;
    }

    if (!isLoggedIn) {
      showError('请先登录');
      return;
    }

    try {
      setSubmitting(true);
      const response = await createComment(post.id, commentText.trim());
      
      if (response.success) {
        showSuccess('评论发布成功');
        setCommentText('');
        loadComments(1, false);
      }
    } catch (error) {
      console.error('发布评论失败:', error);
      showError('发布评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 评论项组件 - 美化版本
  const CommentItem = ({ item }) => (
    <View style={{
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginBottom: 8,
    }}>
      <Avatar
        uri={item.author.avatar}
        name={item.author.name}
        size={36}
        style={{ 
          marginRight: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      />
      <View style={{ flex: 1 }}>
        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 1,
          borderWidth: 1,
          borderColor: COLORS.borderLight,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 6,
          }}>
            <Text style={{
              fontWeight: '700',
              color: COLORS.text,
              fontSize: 14,
              flex: 1,
            }}>
              {item.author.name}
            </Text>
            <Text style={{
              color: COLORS.textMuted,
              fontSize: 11,
              fontWeight: '500',
            }}>
              {timeAgo(item.createdAt)}
            </Text>
          </View>
          <Text style={{
            color: COLORS.text,
            fontSize: 15,
            lineHeight: 20,
            letterSpacing: 0.2,
          }}>
            {item.content}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ 
      marginTop: 12,
      backgroundColor: COLORS.bg,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* 评论按钮 - 美化版本 */}
      <TouchableOpacity
        onPress={toggleExpanded}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 14,
          backgroundColor: COLORS.surface,
          borderBottomWidth: expanded ? 1 : 0,
          borderBottomColor: COLORS.borderLight,
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Ionicons 
            name="chatbubble-outline" 
            size={18} 
            color={COLORS.primary} 
            style={{ marginRight: 8 }}
          />
          <Text style={{
            color: COLORS.text,
            fontSize: 15,
            fontWeight: '600',
          }}>
            {total > 0 ? `${total} 条评论` : '评论'}
          </Text>
        </View>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Text style={{
            color: COLORS.textMuted,
            fontSize: 13,
            marginRight: 4,
          }}>
            {expanded ? '收起' : '展开'}
          </Text>
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={COLORS.textMuted}
          />
        </View>
      </TouchableOpacity>

      {/* 评论区域 */}
      {expanded && (
        <View style={{
          backgroundColor: COLORS.bg,
        }}>
          {/* 评论输入框 - 美化版本 */}
          {isLoggedIn && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: COLORS.surface,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.borderLight,
            }}>
              <Avatar
                uri={user?.avatar}
                name={user?.name}
                size={36}
                style={{ 
                  marginRight: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              />
              <View style={{ flex: 1, marginRight: 12 }}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="写下你的想法..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  maxLength={500}
                  style={{
                    backgroundColor: COLORS.bg,
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 15,
                    color: COLORS.text,
                    maxHeight: 100,
                    minHeight: 44,
                    borderWidth: 1,
                    borderColor: COLORS.borderLight,
                    textAlignVertical: 'top',
                  }}
                />
              </View>
              <TouchableOpacity
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || submitting}
                style={{
                  backgroundColor: commentText.trim() ? COLORS.primary : COLORS.borderLight,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  minWidth: 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: commentText.trim() ? COLORS.primary : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: commentText.trim() ? 3 : 0,
                }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={{
                    color: commentText.trim() ? 'white' : COLORS.textMuted,
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                    发布
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* 评论列表 */}
          {loading && comments.length === 0 ? (
            <View style={{
              paddingVertical: 40,
              alignItems: 'center',
            }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={{
                color: COLORS.textMuted,
                fontSize: 14,
                marginTop: 12,
                fontWeight: '500',
              }}>
                加载评论中...
              </Text>
            </View>
          ) : (
            <View style={{ paddingTop: 8 }}>
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <CommentItem item={item} />}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={{
                    paddingVertical: 40,
                    alignItems: 'center',
                  }}>
                    <Ionicons 
                      name="chatbubble-outline" 
                      size={48} 
                      color={COLORS.borderLight}
                      style={{ marginBottom: 12 }}
                    />
                    <Text style={{
                      color: COLORS.textMuted,
                      fontSize: 15,
                      fontWeight: '500',
                    }}>
                      还没有评论
                    </Text>
                    <Text style={{
                      color: COLORS.textMuted,
                      fontSize: 13,
                      marginTop: 4,
                    }}>
                      来说点什么吧
                    </Text>
                  </View>
                }
              />
            </View>
          )}

          {/* 加载更多 - 美化版本 */}
          {hasMore && comments.length > 0 && (
            <TouchableOpacity
              onPress={() => loadComments(page + 1, true)}
              style={{
                paddingVertical: 16,
                alignItems: 'center',
                backgroundColor: COLORS.surface,
                marginTop: 8,
                borderTopWidth: 1,
                borderTopColor: COLORS.borderLight,
              }}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                {loading && (
                  <ActivityIndicator 
                    size="small" 
                    color={COLORS.primary} 
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={{
                  color: COLORS.primary,
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  {loading ? '加载中...' : '查看更多评论'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default CommentsSection;
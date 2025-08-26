import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { COLORS } from '../theme/colors';
import { getPostComments, createComment, getPostCommentsCount } from '../services/onlineOnlyStorage';
import { useUser } from '../contexts/UserContext';
import { useToastContext } from '../contexts/ToastContext';


const CommentsDrawer = ({ visible, onClose, post, onCommentCountUpdate }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const { user, isLoggedIn } = useUser();
  const { showError, showSuccess } = useToastContext();

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

  // 加载更多评论
  const loadMoreComments = () => {
    if (!loading && hasMore) {
      loadComments(page + 1, true);
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
        // 重新加载评论列表
        loadComments(1, false);
        // 获取最新的评论数量并通知父组件
        try {
          const newCount = await getPostCommentsCount(post.id);
          if (onCommentCountUpdate) {
            onCommentCountUpdate(post.id, newCount);
          }
        } catch (error) {
          console.error('获取评论数量失败:', error);
        }
      }
    } catch (error) {
      console.error('发布评论失败:', error);
      showError('发布评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 当弹窗打开时加载评论
  useEffect(() => {
    if (visible && post?.id) {
      setComments([]);
      setPage(1);
      setHasMore(true);
      setTotal(0);
      loadComments(1, false);
    }
  }, [visible, post?.id]);

  // 评论项组件
  const CommentItem = ({ item }) => (
    <View style={{
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.borderLight,
    }}>
      <Avatar
        uri={item.author.avatar}
        name={item.author.name}
        size={36}
        style={{ marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 10,
        }}>
          <Text style={{
            fontWeight: '800',
            color: COLORS.textMuted,
            fontSize: 16,
            marginRight: 8,
          }}>
            @{item.author.name}
          </Text>
          {item.author.id === item.post_author_id && (
            <View
              style={{
                backgroundColor: COLORS.borderLight,
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 20,
                marginRight: 10
              }}
            >
              <Text style={{ fontSize: 12, color: COLORS.primary }}>作者</Text>
            </View>
          )}
          <Text style={{
            color: COLORS.textMuted,
            fontSize: 12,
          }}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>
        <Text style={{
          color: COLORS.text,
          fontSize: 14,
          lineHeight: 20,
        }}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  // 列表底部组件
  const renderFooter = () => {
    if (!hasMore) {
      return (
        <View style={{
          paddingVertical: 20,
          alignItems: 'center',
        }}>
          <Text style={{
            color: COLORS.textMuted,
            fontSize: 12,
          }}>
            {comments.length > 0 ? '没有更多评论了' : '暂无评论'}
          </Text>
        </View>
      );
    }

    if (loading && comments.length > 0) {
      return (
        <View style={{
          paddingVertical: 20,
          alignItems: 'center',
        }}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* 头部 */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.borderLight,
            backgroundColor: COLORS.surface,
          }}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{
                color: COLORS.primary,
                fontSize: 16,
                fontWeight: '600',
              }}>
                关闭
              </Text>
            </TouchableOpacity>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: COLORS.text,
            }}>
              评论 · {total}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* 评论列表 */}
          <View style={{ flex: 1 }}>
            {loading && comments.length === 0 ? (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{
                  color: COLORS.textMuted,
                  fontSize: 14,
                  marginTop: 12,
                }}>
                  加载评论中...
                </Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <CommentItem item={item} />}
                onEndReached={loadMoreComments}
                onEndReachedThreshold={0.1}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          {/* 评论输入框 */}
          {isLoggedIn && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 15,
              borderTopWidth: 1,
              borderTopColor: COLORS.borderLight,
              backgroundColor: COLORS.surface,
            }}>
              <Avatar
                uri={user?.avatar}
                name={user?.name}
                size={36}
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1, marginRight: 12 }}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="期待你的友善评论..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  maxLength={500}
                  style={{
                    backgroundColor: COLORS.bg,
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: COLORS.text,
                    maxHeight: 100,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                />
              </View>
              <Button
                title="发布"
                variant="primary"
                size="small"
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || submitting}
                style={{ minWidth: 60 }}
              />
            </View>
          )}

          {!isLoggedIn && (
            <View style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: COLORS.borderLight,
              backgroundColor: COLORS.surface,
              alignItems: 'center',
            }}>
              <Text style={{
                color: COLORS.textMuted,
                fontSize: 14,
              }}>
                登录后可以发表评论
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default CommentsDrawer;
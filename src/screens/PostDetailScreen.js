import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Image,
  RefreshControl,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import ImageViewer from 'react-native-image-zoom-viewer';
import { getPostById, getPostComments, createComment, getPostCommentsCount, createMark, removeMark, checkMarkStatus } from '../services/onlineOnlyStorage';
import { useToastContext } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';
import { moods } from '../theme/moods';
import { SERVER_BASE_URL } from '../config/env';


const { width } = Dimensions.get('window');


const PostDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerImages, setViewerImages] = useState([]);

  // 评论相关状态
  const [comments, setComments] = useState([]);
  
  // Mark相关状态
  const [isMarked, setIsMarked] = useState(false);
  const [markLoading, setMarkLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const { showError, showSuccess } = useToastContext();
  const { user, isLoggedIn } = useUser();

  // 动画值
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadPostDetail();
  }, [postId]);

  // 单独的useEffect来加载评论，确保帖子加载完成后立即加载评论
  useEffect(() => {
    if (post?.id) {
      loadComments(1, false);
    }
  }, [post?.id]);

  useEffect(() => {
    if (post) {
      // 启动入场动画
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [post]);

  const loadPostDetail = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getPostById(postId);

      if (response.success) {
        setPost(response.data);
        
        // 检查mark状态
        if (user) {
          try {
            const markResponse = await checkMarkStatus(postId);
            if (markResponse.success) {
              setIsMarked(markResponse.data.isMarked);
            }
          } catch (error) {
            console.error('检查mark状态失败:', error);
          }
        }
      } else {
        showError('帖子不存在或已被删除');
        navigation.goBack();
        return;
      }
    } catch (error) {
      console.error('加载帖子详情失败:', error);
      showError('加载失败，请重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 加载评论
  const loadComments = async (page = 1, append = false) => {
    if (!post?.id) return;

    try {
      setCommentsLoading(true);
      const response = await getPostComments(post.id, page, 20);

      if (response.success) {
        const { comments: newComments, total, hasMore } = response.data;

        if (append) {
          setComments(prev => [...prev, ...newComments]);
        } else {
          setComments(newComments);
        }

        setHasMoreComments(hasMore);
        setCommentsPage(page);

        // 更新帖子的评论数量
        setPost(prev => ({ ...prev, comments_count: total }));
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      showError('加载评论失败');
    } finally {
      setCommentsLoading(false);
    }
  };

  // 加载更多评论
  const loadMoreComments = () => {
    if (!commentsLoading && hasMoreComments) {
      loadComments(commentsPage + 1, true);
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
      setSubmittingComment(true);
      const response = await createComment(post.id, commentText.trim());

      if (response.success) {
        showSuccess('评论发布成功');
        setCommentText('');
        // 重新加载评论列表
        loadComments(1, false);
      }
    } catch (error) {
      console.error('发布评论失败:', error);
      showError('发布评论失败');
    } finally {
      setSubmittingComment(false);
    }
  };



  const handleRefresh = () => {
    // 重置评论状态
    setComments([]);
    setCommentsPage(1);
    setHasMoreComments(true);
    
    // 同时刷新帖子和评论
    loadPostDetail(true);
    
    // 直接重新加载评论
    if (post?.id) {
      loadComments(1, false);
    }
  };

  const openImageViewer = (images, index = 0) => {
    const imgs = images.map(img => ({
      uri: SERVER_BASE_URL + img.uri,
      id: img.id
    }));
    setViewerImages(imgs);
    setViewerIndex(index);
    setViewerVisible(true);
  };



  const timeAgo = (date) => {
    const ts = new Date(date).getTime();
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

  const renderImages = () => {
    if (!post.images || post.images === "") return null;

    const images = post.images;

    if (images.length === 1) {
      // 单张图片 - 大图显示
      return (
        <TouchableOpacity
          style={styles.singleImageContainer}
          onPress={() => openImageViewer(images, 0)}
        >
          <Image
            source={{ uri: SERVER_BASE_URL + (images[0].uri || images[0]) }}
            style={styles.singleImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    } else if (images.length === 2) {
      // 两张图片 - 左右分布
      return (
        <View style={styles.twoImageContainer}>
          {images.map((image, index) => (
            <TouchableOpacity
              key={image.id}
              style={styles.twoImageWrapper}
              onPress={() => openImageViewer(images, index)}
            >
              <Image
                source={{ uri: SERVER_BASE_URL + image.uri }}
                style={styles.twoImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      );
    } else if (images.length === 3) {
      // 三张图片 - 一大两小布局
      return (
        <View style={styles.threeImageContainer}>
          <TouchableOpacity
            style={styles.threeImageMain}
            onPress={() => openImageViewer(images, 0)}
          >
            <Image
              source={{ uri: SERVER_BASE_URL + images[0].uri }}
              style={styles.threeImageMainImg}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <View style={styles.threeImageSide}>
            {images.slice(1).map((image, index) => (
              <TouchableOpacity
                key={image.id}
                style={styles.threeImageSideWrapper}
                onPress={() => openImageViewer(images, index + 1)}
              >
                <Image
                  source={{ uri: SERVER_BASE_URL + image.uri }}
                  style={styles.threeImageSideImg}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    } else if (images.length === 4) {
      // 四张图片 - 2x2网格
      return (
        <View style={styles.fourImageContainer}>
          {images.map((image, index) => (
            <TouchableOpacity
              key={image.id}
              style={styles.fourImageWrapper}
              onPress={() => openImageViewer(images, index)}
            >
              <Image
                source={{ uri: SERVER_BASE_URL + image.uri }}
                style={styles.fourImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      );
    } else {
      // 多张图片 - 瀑布流布局
      return (
        <View style={styles.masonryContainer}>
          <View style={styles.masonryColumn}>
            {images.filter((_, index) => index % 2 === 0).map((image, index) => (
              <TouchableOpacity
                key={image.id}
                style={[styles.masonryImageWrapper, { marginBottom: 8 }]}
                onPress={() => openImageViewer(images, index * 2)}
              >
                <Image
                  source={{ uri: SERVER_BASE_URL + image.uri }}
                  style={[styles.masonryImage, { height: 120 + (index % 3) * 40 }]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.masonryColumn}>
            {images.filter((_, index) => index % 2 === 1).map((image, index) => (
              <TouchableOpacity
                key={image.id}
                style={[styles.masonryImageWrapper, { marginBottom: 8 }]}
                onPress={() => openImageViewer(images, index * 2 + 1)}
              >
                <Image
                  source={{ uri: SERVER_BASE_URL + image.uri }}
                  style={[styles.masonryImage, { height: 140 + (index % 3) * 30 }]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
  };

  const renderTags = () => {
    if (!post.tags || post.tags.split(",").length === 0) return null;
    const tags = post.tags.split(",");
    return (
      <View style={styles.tagsContainer}>
        <Ionicons name="pricetag-outline" size={16} color="#8E8E93" style={styles.tagIcon} />
        {tags.map((tag, index) => (
          <TouchableOpacity key={index} style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // 处理头像点击
  const handleUserPress = (userId) => {
    navigation.navigate('UserProfile', { userId: userId });
  };

  // 处理mark点击
  const handleMarkPress = async () => {
    if (!user) {
      showError('请先登录');
      return;
    }

    // 检查是否是自己的帖子
    if (post && post.user_id === user.id) {
      showError('不能标记自己的帖子');
      return;
    }
    
    if (markLoading) return;
    
    setMarkLoading(true);
    
    try {
      if (isMarked) {
        const response = await removeMark(postId);
        if (response.success) {
          setIsMarked(false);
          showSuccess('已取消标记');
        }
      } else {
        const response = await createMark(postId);
        if (response.success) {
          setIsMarked(true);
          showSuccess('已添加到我的标记 ✨');
        }
      }
    } catch (error) {
      console.error('Mark操作失败:', error);
      if (error.response?.status === 409) {
        setIsMarked(true);
        showSuccess('已添加到我的标记 ✨');
      } else if (error.response?.status === 403) {
        showError('不能标记自己的帖子');
      } else {
        showError('操作失败，请重试');
      }
    } finally {
      setMarkLoading(false);
    }
  };

  // 评论项组件
  const CommentItem = ({ item }) => (
    <View style={styles.commentItem}>
      {/* 根据评论作者是否匿名决定是否可点击 */}
      {item.author.name === '匿名用户' ? (
        <Avatar
          uri={''}
          name={'匿名用户'}
          size={36}
          style={styles.commentAvatar}
        />
      ) : (
        <Pressable onPress={() => handleUserPress(item.author.id)}>
          <Avatar
            uri={item.author.avatar}
            name={item.author.name}
            size={36}
            style={styles.commentAvatar}
          />
        </Pressable>
      )}
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>
            @{item.author.name}
          </Text>
          {item.author.id === item.post_author_id && (
            <View style={styles.authorBadge}>
              <Text style={styles.authorBadgeText}>作者</Text>
            </View>
          )}
          <Text style={styles.commentTime}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>
        <Text style={styles.commentText}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  // 评论列表底部组件
  const renderCommentsFooter = () => {
    if (!hasMoreComments) {
      return (
        <View style={styles.commentsFooter}>
          <Text style={styles.commentsFooterText}>
            {comments.length > 0 ? '没有更多评论了' : '暂无评论'}
          </Text>
        </View>
      );
    }

    if (commentsLoading && comments.length > 0) {
      return (
        <View style={styles.commentsFooter}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>帖子详情</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>帖子详情</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.errorText}>帖子不存在</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadPostDetail()}>
            <Text style={styles.retryText}>重试</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 渲染帖子头部内容
  const renderPostHeader = () => (
    <Animated.View
      style={[
        styles.contentContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* 主内容毛玻璃卡片 */}
      <View style={styles.userCard}>
        {/* 用户信息 */}
        <View style={styles.userSection}>
          {/* 根据是否匿名决定是否可点击 */}
          {post.is_anonymous ? (
            <Avatar
              uri={''}
              name={'匿名用户'}
              size={80}
              style={styles.avatar}
            />
          ) : (
            <Pressable onPress={() => handleUserPress(post.user_id)}>
              <Avatar
                uri={post.avatar}
                name={post.username || '匿名用户'}
                size={80}
                style={styles.avatar}
              />
            </Pressable>
          )}
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>
                {post.is_anonymous ? '匿名用户' : (post.username || '匿名用户')}
              </Text>
              {post.mood && (
                <View style={styles.moodBadge}>
                  <Text style={styles.moodText}>
                    {(() => {
                      const mood = moods.find(m => m.value.trim() === post.mood.trim());
                      return mood ? mood.emoji + ' ' + mood.label : post.mood;
                    })()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.timeText}>
              {new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.mainCard}>
        {/* 帖子内容 */}
        <Text style={styles.content}>{post.content}</Text>

        {/* 图片展示 */}
        {renderImages()}

        {/* 标签区域 */}
        {post.tags && post.tags.split(",").length > 0 && (
          <View style={styles.tagsSection}>
            {renderTags()}
          </View>
        )}
      </View>

      {/* 评论区域标题 */}
      <View style={styles.commentsSectionHeader}>
        <Text style={styles.commentsSectionTitle}>
          评论 · {post.comments_count || 0}
        </Text>
      </View>

      {/* 评论输入框 */}
      {isLoggedIn && (
        <View style={styles.commentInputSection}>
          <Avatar
            uri={user?.avatar}
            name={user?.name}
            size={40}
            style={styles.inputAvatar}
          />
          <View style={styles.inputWrapper}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="期待你的友善评论..."
              placeholderTextColor="#C7C7CC"
              multiline
              maxLength={500}
              style={styles.commentInput}
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!commentText.trim() || submittingComment) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || submittingComment}
            >
              <Text style={[
                styles.submitButtonText,
                (!commentText.trim() || submittingComment) && styles.submitButtonTextDisabled
              ]}>
                发布
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!isLoggedIn && (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>
            登录后可以发表评论
          </Text>
        </View>
      )}
    </Animated.View>
  );

  // 准备FlatList数据
  const flatListData = [
    { type: 'header', id: 'header' },
    ...comments.map(comment => ({ type: 'comment', ...comment }))
  ];

  // 渲染FlatList项目
  const renderFlatListItem = ({ item }) => {
    if (item.type === 'header') {
      return renderPostHeader();
    } else if (item.type === 'comment') {
      return <CommentItem item={item} />;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* 毛玻璃背景 */}
      <LinearGradient
        colors={['#E6F2FF', '#C3D9F2', '#A1BFDE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>帖子详情</Text>
        {user && post && post.user_id !== user.id && (
          <TouchableOpacity
            style={styles.markButton}
            onPress={handleMarkPress}
            disabled={markLoading}
          >
            {markLoading ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <Ionicons 
                name={isMarked ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={isMarked ? "#FF6B35" : "#666"} 
              />
            )}
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {commentsLoading && comments.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>加载评论中...</Text>
          </View>
        ) : (
          <FlatList
            data={flatListData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFlatListItem}
            onEndReached={loadMoreComments}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderCommentsFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#007AFF']}
                tintColor="#007AFF"
              />
            }
            showsVerticalScrollIndicator={true}
            style={styles.flatList}
            contentContainerStyle={styles.flatListContent}
          />
        )}
      </KeyboardAvoidingView>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 10,
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  markButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    flexGrow: 1,
  },
  contentContainer: {
    // paddingTop: 20,
    gap: 20,
  },

  userCard: {
    paddingLeft: 18,
    paddingRight: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e3d2ff'
  },

  // 主内容卡片
  mainCard: {
    paddingLeft: 24,
    paddingRight: 24,
    width: '100%',
  },

  // 用户信息区域
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  moodBadge: {
    backgroundColor: 'rgba(0,122,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  moodText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
  },
  timeText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },

  // 内容
  content: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.textSecondary,
    fontWeight: '400',
    marginBottom: 16,
  },

  // 图片样式
  singleImageContainer: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: 220,
  },

  // 两张图片布局
  twoImageContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  twoImageWrapper: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  twoImage: {
    width: '100%',
    height: 160,
  },

  // 三张图片布局
  threeImageContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    height: 180,
  },
  threeImageMain: {
    flex: 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  threeImageMainImg: {
    width: '100%',
    height: '100%',
  },
  threeImageSide: {
    flex: 1,
    gap: 8,
  },
  threeImageSideWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  threeImageSideImg: {
    width: '100%',
    height: '100%',
  },

  // 四张图片布局
  fourImageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  fourImageWrapper: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  fourImage: {
    width: '100%',
    height: 120,
  },

  // 瀑布流布局
  masonryContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  masonryColumn: {
    flex: 1,
  },
  masonryImageWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  masonryImage: {
    width: '100%',
  },

  // 标签区域
  tagsSection: {
    marginTop: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagIcon: {
    marginRight: 8,
  },
  tag: {
    // backgroundColor: 'rgba(0,122,255,0.15)',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },

  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    // paddingVertical: 16,
  },
  commentsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },

  // 评论输入区域
  commentInputSection: {
    flexDirection: 'row',
    alignItems: 'space-between',
    paddingVertical: 10,
  },
  inputAvatar: {
    marginLeft: 12,
    marginRight: 12,
    marginTop: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 12,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    maxHeight: 80,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(199,199,204,0.6)',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#8E8E93',
  },

  // 评论项
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  commentAvatar: {
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthor: {
    fontWeight: '600',
    color: '#556f59',
    fontSize: 15,
    marginRight: 8,
  },
  authorBadge: {
    backgroundColor: 'rgba(0,122,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  authorBadgeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  commentTime: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  commentText: {
    color: '#333',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },

  // 评论加载状态
  commentsLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  commentsFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  commentsFooterText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  loginPrompt: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loginPromptText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '500',
  },

  // 加载和错误状态
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PostDetailScreen;
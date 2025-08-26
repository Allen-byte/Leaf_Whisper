import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../services/onlineOnlyStorage';
import { useToastContext } from '../contexts/ToastContext';
import { Avatar } from '../components/ui/Avatar';

const { width } = Dimensions.get('window');

// 创建独立的通知项组件
const NotificationItem = ({ item, index, onPress, onDelete, onAvatarPress }) => {
  const itemFadeAnim = useRef(new Animated.Value(0)).current;
  const itemSlideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const delay = index * 100;
    Animated.parallel([
      Animated.timing(itemFadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(itemSlideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return 'chatbubble';
      case 'like':
        return 'heart';
      case 'follow':
        return 'person-add';
      case 'mark':
        return 'bookmark';
      case 'system':
        return 'notifications';
      default:
        return 'mail';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'comment':
        return ['#F9F2EF', '#F9F2EF'];
      case 'like':
        return ['#FF6B6B', '#FF8E8E'];
      case 'follow':
        return ['#4ECDC4', '#44A08D'];
      case 'mark':
        return ['#F7971E', '#FFD200'];
      case 'system':
        return ['#45B7D1', '#96C93D'];
      default:
        return ['#9B59B6', '#8E44AD'];
    }
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;

    return new Date(timestamp).toLocaleDateString();
  };

  const post_cont = item.content.split('：')[1] ? item.content.split('：')[1].replace(/"/g, '').replace("\n", '') : '';

  return (
    <Animated.View
      style={[
        styles.notificationWrapper,
        {
          opacity: itemFadeAnim,
          transform: [{ translateY: itemSlideAnim }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.notificationItem}
        onPress={() => onPress(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={item.is_read ? ['#FFFAE4', '#e9ecef'] : getNotificationColor(item.type)}
          style={styles.notificationGradient}
        >
          {!item.is_read && <View style={styles.unreadIndicator} />}

          <View style={styles.notificationHeader}>
            <LinearGradient
              colors={item.is_read ? ['#6c757d', '#495057'] : ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.iconContainer}
            >
              <Pressable onPress={() => { onAvatarPress(item.related_user_id) }}>
                <Avatar
                  uri={item.related_user_avatar}
                  size={40}
                />
              </Pressable>
            </LinearGradient>

            <View style={styles.notificationInfo}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                }}
              >
                @{item.related_user_name}
              </Text>
              <Text style={[styles.notificationTime, item.is_read ? {} : styles.unreadTime]}>
                {formatTime(item.created_at)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close"
                size={16}
                color={item.is_read ? COLORS.textSecondary : 'rgba(255,255,255,0.7)'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.notificationContent}>
            <Text style={[styles.notificationContentText, item.is_read ? {} : styles.unreadContent]}>
              {item.type === 'follow'
                ? item.content
                : `${item.content.split("：")[0]}: 《${post_cont.length > 10 ? post_cont.substring(0, 10) + '...' : post_cont}》`
              }
            </Text>
          </View>
          {/* 评论内容 - 只在有评论内容时显示 */}
          {item.comment_content && (
            <View style={{ marginTop: 10, borderLeftColor: COLORS.textSecondary, borderLeftWidth: 3, borderRadius: 5, paddingLeft: 10 }}>
              <Text style={{ fontSize: 16, color: '#556F59' }}>
                {item.comment_content}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const MessageCenterScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useToastContext();


  // 动画值
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const loadNotifications = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await getNotifications(pageNum, 20);


      if (response.success) {
        const allNotifications = response.data?.notifications || [];
        // 过滤掉每日任务通知，因为它们有自己的全屏动画展示
        const newNotifications = allNotifications.filter(n => n.type !== 'daily_task');

        if (isRefresh || pageNum === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }

        setHasMore(pageNum < (response.data?.totalPages || 0));
        setPage(pageNum);

        // 计算未读数量
        const unread = newNotifications.filter(n => !n.is_read).length;
        if (pageNum === 1) {
          setUnreadCount(unread);
        }

        // 清除错误状态
        setError(null);
      } else {
        // API调用成功但返回失败状态，设置为空数组
        console.log('API返回失败状态:', response);
        if (pageNum === 1) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      setError(error.message || '加载消息失败');
      if (pageNum === 1) {
        setNotifications([]);
        setUnreadCount(0);
      }
      showError('加载消息失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    // 启动入场动画（无论是否有通知）
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
  }, [notifications]);

  const handleRefresh = () => {
    loadNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadNotifications(page + 1);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await markNotificationAsRead(notificationId);
      if (response.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllNotificationsAsRead();
      if (response.success) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        setUnreadCount(0);
        showSuccess('成功', '所有消息已标记为已读');
      }
    } catch (error) {
      console.error('标记所有已读失败:', error);
      showError('错误', '操作失败');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    Alert.alert(
      '确认删除',
      '确定要删除这条消息吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteNotification(notificationId);
              if (response.success) {
                setNotifications(prev => {
                  const notification = prev.find(n => n.id === notificationId);
                  if (notification && !notification.is_read) {
                    setUnreadCount(count => Math.max(0, count - 1));
                  }
                  return prev.filter(notification => notification.id !== notificationId);
                });
              }
            } catch (error) {
              console.error('删除消息失败:', error);
              Alert.alert('错误', '删除失败');
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = async (notification) => {
    // 标记为已读
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // 根据通知类型导航到相应页面
    switch (notification.type) {
      case 'comment':
        if (notification.related_post_id) {
          navigation.navigate('PostDetail', { postId: notification.related_post_id });
        }
        break;
      case 'like':
        if (notification.related_post_id) {
          navigation.navigate('PostDetail', { postId: notification.related_post_id });
        }
        break;
      case 'follow':
        if (notification.related_user_id) {
          navigation.navigate('UserProfile', { userId: notification.related_user_id });
        }
        break;
      case 'mark':
        if (notification.related_post_id) {
          navigation.navigate('PostDetail', { postId: notification.related_post_id });
        }
        break;
      case 'system':
        // 系统通知可能不需要特定导航
        break;
      default:
        break;
    }
  };

  // 处理头像点击
  const handleUserPress = (userId) => {
    navigation.navigate('UserProfile', { userId: userId });
  };



  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;

    return new Date(timestamp).toLocaleDateString();
  };

  // 简化的渲染函数
  const renderNotificationItem = ({ item, index }) => (
    <NotificationItem
      item={item}
      index={index}
      onPress={handleNotificationPress}
      onDelete={handleDeleteNotification}
      onAvatarPress={handleUserPress}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>消息中心</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          <LinearGradient
            colors={unreadCount > 0 ? [COLORS.primary, COLORS.primaryDark] : ['#E9ECEF', '#DEE2E6']}
            style={styles.markAllGradient}
          >
            <Text style={[
              styles.markAllText,
              { color: unreadCount > 0 ? 'white' : COLORS.textSecondary }
            ]}>全部已读</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) {
      return (
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>没有更多消息了</Text>
          <View style={styles.footerLine} />
        </View>
      );
    }

    if (loading && notifications.length > 0) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingFooterText}>加载中...</Text>
        </View>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    const isError = error !== null;

    return (
      <Animated.View
        style={[
          styles.emptyContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={isError ? ['#ef4444', '#dc2626'] : ['#667eea', '#764ba2']}
          style={styles.emptyIconContainer}
        >
          <Ionicons
            name={isError ? "alert-circle-outline" : "mail-outline"}
            size={48}
            color="white"
          />
        </LinearGradient>
        <Text style={styles.emptyText}>
          {isError ? '加载失败' : '暂无消息'}
        </Text>
        <Text style={styles.emptySubText}>
          {isError
            ? '网络连接异常，请检查网络后重试'
            : ''
          }
        </Text>
      </Animated.View>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <Animated.View
        style={[
          styles.listContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          },
          { flex: 1 }
        ]}
      >
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => `n_${item.id}_${item.created_at}`}
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
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && { flex: 1 }
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: 40
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  unreadBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  markAllGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  notificationWrapper: {
    marginBottom: 12,
  },
  notificationItem: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationGradient: {
    padding: 16,
    position: 'relative',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4757',
  },
  notificationContent: {
    flex: 1,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    paddingBottom: 10,

  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  unreadTitle: {
    color: 'white',
    fontWeight: '700',
  },
  notificationTime: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // unreadTime: {
  //   color: 'rgba(255,255,255,0.8)',
  // },
  deleteButton: {
    padding: 4,
    borderRadius: 12,
  },
  notificationContentText: {
    marginBottom: 2,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  unreadContent: {
    // color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  footerLine: {
    height: 1,
    backgroundColor: COLORS.border,
    flex: 1,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  loadingFooterText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  refreshButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MessageCenterScreen;
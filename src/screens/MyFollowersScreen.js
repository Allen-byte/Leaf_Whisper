import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/ui/Avatar';
import { COLORS } from '../theme/colors';
import { useUser } from '../contexts/UserContext';
import { useToastContext } from '../contexts/ToastContext';
import UserService from '../services/userService';

// 粉丝用户项组件
const FollowerUserItem = ({ user, onPress, isOwnProfile }) => (
  <Pressable onPress={() => onPress(user)}>
    {({ pressed }) => (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: pressed ? COLORS.borderLight : COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
      }}>
        {/* 用户头像 */}
        <Avatar
          size={50}
          name={user.name}
          uri={user.avatar}
          style={{ marginRight: 15 }}
        />

        {/* 用户信息 */}
        <View style={{ flex: 1 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: COLORS.text,
              marginRight: 8,
            }}>
              {user.name}
            </Text>

            {/* 性别图标 */}
            {user.sex && (
              <View style={{
                backgroundColor: user.sex === 'male' ? '#e3f2fd' : '#fce4ec',
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 8,
              }}>
                <Ionicons
                  name={user.sex === 'male' ? 'male' : 'female'}
                  size={10}
                  color={user.sex === 'male' ? '#2196f3' : '#e91e63'}
                />
              </View>
            )}
          </View>

          {/* 邮箱 */}
          {/* <Text style={{
            fontSize: 14,
            color: COLORS.textSecondary,
            marginBottom: 4,
          }}>
            {user.email || '无邮箱'}
          </Text> */}

          {/* 个人简介 */}
          {/* {user.bio && (
            <Text style={{
              fontSize: 13,
              color: COLORS.textMuted,
              marginBottom: 4,
            }} numberOfLines={1}>
              {user.bio}
            </Text>
          )} */}

          {/* 关注时间 */}
          <Text style={{
            fontSize: 12,
            color: COLORS.textMuted,
          }}>
            {new Date(user.followed_at).toLocaleDateString('zh-CN')} 关注了{isOwnProfile?'你':'ta'}
          </Text>
        </View>

        {/* 箭头图标 */}
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </View>
    )}
  </Pressable>
);

export const MyFollowersScreen = ({ navigation, route }) => {
  const [followersList, setFollowersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const { user } = useUser();
  const { showError } = useToastContext();

  // 支持查看其他用户的粉丝列表
  const { userId: targetUserId, userName } = route.params || {};
  const isOwnProfile = !targetUserId || (user && user.id === parseInt(targetUserId));
  const displayUserId = targetUserId || user?.id;
  const displayUserName = userName || user?.name || '我';

  useEffect(() => {
    if (displayUserId) {
      loadFollowersList();
    } else if (!user) {
      showError('请先登录');
      navigation.goBack();
    }
  }, [displayUserId, user]);

  const loadFollowersList = async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = isOwnProfile
        ? await UserService.getMyFollowers(pageNum, 20)
        : await UserService.getFollowers(displayUserId, pageNum, 20);

      if (response.success) {
        const newUsers = response.followers.users || [];

        if (isRefresh || pageNum === 1) {
          setFollowersList(newUsers);
        } else {
          setFollowersList(prev => [...prev, ...newUsers]);
        }

        setTotalCount(response.followers.total || 0);
        setHasMore(newUsers.length === 20 && pageNum < (response.followers.totalPages || 1));
        setPage(pageNum);
      } else {
        showError(response.error || '获取粉丝列表失败');
      }
    } catch (error) {
      console.error('获取粉丝列表失败:', error);
      showError('获取粉丝列表失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadFollowersList(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      loadFollowersList(nextPage);
    }
  };

  const handleUserPress = (selectedUser) => {
    // 导航到用户详情页面
    navigation.navigate('UserProfile', { userId: selectedUser.id });
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={{
        paddingVertical: 20,
        alignItems: 'center',
      }}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={{
          marginTop: 8,
          fontSize: 14,
          color: COLORS.textMuted,
        }}>
          加载更多...
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    }}>
      <Ionicons name="heart-outline" size={64} color={COLORS.textMuted} />
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginTop: 16,
        marginBottom: 8,
      }}>
        还没有粉丝
      </Text>
      <Text style={{
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        paddingHorizontal: 40,
      }}>
        多发一些有趣的内容来吸引粉丝吧
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 15,
          backgroundColor: COLORS.surface,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.borderLight,
        }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: COLORS.text,
          }}>
            {isOwnProfile ? '我的粉丝' : `${displayUserName}的粉丝`}
          </Text>
        </View>

        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{
            marginTop: 16,
            fontSize: 16,
            color: COLORS.textMuted,
          }}>
            加载中...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, paddingTop: 30 }}>
      {/* 头部导航 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
      }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ marginRight: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: COLORS.text,
          }}>
            {isOwnProfile ? '我的粉丝' : `${displayUserName}的粉丝`}
          </Text>
          <Text style={{
            fontSize: 13,
            color: COLORS.textMuted,
            marginTop: 2,
          }}>
            {totalCount} 人
          </Text>
        </View>
      </View>

      {/* 粉丝列表 */}
      <FlatList
        data={followersList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <FollowerUserItem
            user={item}
            onPress={handleUserPress}
            isOwnProfile={isOwnProfile}
          />
        )}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
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
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};
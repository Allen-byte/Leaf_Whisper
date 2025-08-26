import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../components/ui/Avatar';
import { COLORS } from '../theme/colors';
import { getUsersStats } from '../services/onlineOnlyStorage';
import { useToastContext } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { BackgroundImage } from '../components/ui/BackgroundImage';
import { useFocusEffect } from '@react-navigation/native';
import UserService from '../services/userService';

// Twitter风格统计项组件
const TwitterStatItem = ({ label, value, subtitle }) => (
  <View style={{ alignItems: 'center' }}>
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={{
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.3,
      }}>
        {value}
      </Text>
      {subtitle && (
        <Text style={{
          fontSize: 12,
          color: COLORS.textMuted,
          marginLeft: 2,
          fontWeight: '500',
        }}>
          {subtitle}
        </Text>
      )}
    </View>
    <Text style={{
      fontSize: 13,
      color: COLORS.textSecondary,
      fontWeight: '400',
      marginTop: 2,
    }}>
      {label}
    </Text>
  </View>
);

// Twitter风格菜单项组件
const TwitterMenuItem = ({ title, subtitle, onPress, icon }) => (
  <Pressable onPress={onPress}>
    {({ pressed }) => (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: pressed ? COLORS.borderLight : COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
      }}>
        {/* 图标 */}
        <Ionicons name={icon} size={22} color={COLORS.textSecondary} style={{ marginRight: 15 }} />

        {/* 文本内容 */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '400',
            color: COLORS.text,
            marginBottom: subtitle ? 2 : 0,
          }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{
              fontSize: 13,
              color: COLORS.textSecondary,
            }}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* 箭头 */}
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </View>
    )}
  </Pressable>
);

// 高级感统计项组件
const PremiumStatItem = ({ label, value, subtitle, color = COLORS.primary }) => (
  <View style={{
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 5,
    flex: 1,
  }}>
    {/* 渐变背景卡片 */}
    <LinearGradient
      colors={[`${color}15`, `${color}08`]}
      style={{
        width: '100%',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${color}20`,
      }}
    >
      {/* 装饰性线条 */}
      <View style={{
        width: 30,
        height: 3,
        backgroundColor: color,
        borderRadius: 2,
        marginBottom: 12,
      }} />
      
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={{
          fontSize: 24,
          fontWeight: '900',
          color: COLORS.text,
          letterSpacing: -0.5,
        }}>
          {value}
        </Text>
        {subtitle && (
          <Text style={{
            fontSize: 12,
            color: COLORS.textMuted,
            marginLeft: 2,
            fontWeight: '600',
          }}>
            {subtitle}
          </Text>
        )}
      </View>
      
      <Text style={{
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
        marginTop: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {label}
      </Text>
    </LinearGradient>
  </View>
);

// 优化后的高级感菜单项组件 - 使用渐变背景
const PremiumMenuItem = ({ title, subtitle, onPress, icon, gradient = ['#667eea', '#764ba2'] }) => (
  <Pressable onPress={onPress}>
    {({ pressed }) => (
      <View style={{
        marginHorizontal: 20,
        marginVertical: 8,
        borderRadius: 20,
        overflow: 'hidden',
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      }}>
        <LinearGradient
          colors={[`${gradient[0]}12`, `${gradient[1]}08`]}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 20,
            paddingHorizontal: 20,
            borderWidth: 1,
            borderColor: `${gradient[0]}20`,
          }}
        >
          {/* 渐变图标背景 */}
          <LinearGradient
            colors={gradient}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <Ionicons name={icon} size={24} color="white" />
          </LinearGradient>

          {/* 文本内容 */}
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: COLORS.text,
              marginBottom: subtitle ? 3 : 0,
            }}>
              {title}
            </Text>
            {subtitle && (
              <Text style={{
                fontSize: 13,
                color: COLORS.textSecondary,
                lineHeight: 18,
              }}>
                {subtitle}
              </Text>
            )}
          </View>

          {/* 装饰性箭头 */}
          <LinearGradient
            colors={[`${gradient[0]}20`, `${gradient[1]}15`]}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="chevron-forward" size={18} color={gradient[0]} />
          </LinearGradient>
        </LinearGradient>
      </View>
    )}
  </Pressable>
);

export const ProfileScreen = ({ navigation }) => {
  const [userStats, setUserStats] = useState({
    posts: 0,
    comments: 0,
    marks: 0
  });
  const [followStats, setFollowStats] = useState({ following: 0, followers: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);

  const { showError, showConfirm } = useToastContext();
  const { user, logout, refreshUser, isLoggedIn } = useUser();

  // 防抖延迟时间（毫秒）
  const DEBOUNCE_DELAY = 2000;
  // 最小刷新间隔（毫秒）
  const MIN_REFRESH_INTERVAL = 5000;

  useEffect(() => {
    if (isLoggedIn && user) {
      loadAllStats(user.id);
    } else {
      // 如果用户未登录，跳转到登录页
      showError('请先登录');
      setTimeout(() => {
        navigation.replace('Login');
      }, 1000);
    }
  }, [user, isLoggedIn]);

  // 优化后的页面焦点监听，添加防抖和最小刷新间隔
  useFocusEffect(
    React.useCallback(() => {
      if (isLoggedIn && user && !isLoading) {
        const now = Date.now();
        const timeSinceLastLoad = now - lastLoadTime;
        
        // 如果距离上次加载时间超过最小刷新间隔，才重新加载
        if (timeSinceLastLoad > MIN_REFRESH_INTERVAL) {
          const timeoutId = setTimeout(() => {
            loadAllStats(user.id);
          }, DEBOUNCE_DELAY);
          
          return () => clearTimeout(timeoutId);
        }
      }
    }, [isLoggedIn, user, isLoading, lastLoadTime])
  );

  // 合并加载函数，减少并发请求
  const loadAllStats = async (userId) => {
    if (isLoading) return; // 防止重复请求
    
    setIsLoading(true);
    setLastLoadTime(Date.now());
    
    try {
      // 并行加载两个统计数据
      const [userStatsResult, followStatsResult] = await Promise.allSettled([
        loadUserStats(userId),
        loadFollowStats(userId)
      ]);
      
      // 处理结果
      if (userStatsResult.status === 'rejected') {
        console.error('加载用户统计失败:', userStatsResult.reason);
      }
      if (followStatsResult.status === 'rejected') {
        console.error('加载关注统计失败:', followStatsResult.reason);
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserStats = async (userId) => {
    try {
      // 获取用户帖子、点赞、评论、收藏数量
      const userStats = await getUsersStats(userId);
      setUserStats({
        posts: userStats.data.posts || 0,
        comments: userStats.data.comments || 0,
        marks: userStats.data.marks || 0
      });
      return userStats;
    } catch (error) {
      console.error('加载用户统计失败:', error);
      throw error;
    }
  };
  
  const loadFollowStats = async (userId) => {
    try {
      const response = await UserService.getFollowStats(userId);

      if (response.success) {
        setFollowStats({
          following: response.stats.following || 0,
          followers: response.stats.followers || 0
        });
        return response;
      }
    } catch (error) {
      console.error('加载关注统计失败:', error);
      throw error;
    }
  };

  const diffInDays = (target) => {
    const msPerDay = 864e5;           // 1000 * 60 * 60 * 24
    const today = new Date();
    today.setHours(0, 0, 0, 0);     // 把时分秒清零，只比日期
    const targetDate = new Date(target);
    targetDate.setHours(0, 0, 0, 0);

    return Math.round((today - targetDate) / msPerDay);
  }

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleMyPosts = () => {
    navigation.navigate('MyPosts');
  };

  const handleMyComments = () => {
    navigation.navigate('MyComments');
  };

  const handleLogout = async () => {
    showConfirm({
      title: '确认登出',
      message: '你确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      type: 'danger',
      onConfirm: async () => {
        try {
          await logout();
          navigation.replace('Login');
        } catch (error) {
          showError('登出失败');
        }
      }
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 高级感顶部横幅 */}
        <View style={{ position: 'relative' }}>
          <View style={{ height: 220, overflow: 'hidden' }}>
            <BackgroundImage
              imagePath={user?.background_image || ''}
              style={{ height: '100%', width: '100%' }}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          </View>

          <View style={{
            position: 'absolute',
            top: 50,
            right: 20,
            zIndex: 2,
          }}>
            <Pressable
              onPress={handleEditProfile}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 25,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Text style={{
                color: COLORS.primary,
                fontSize: 14,
                fontWeight: '600',
              }}>
                编辑
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 修改后的用户信息区域 - 白色背景，减少高度 */}
        <View style={{
          backgroundColor: 'transparent',
          paddingHorizontal: 20,
          marginTop: -60,
          zIndex: 1,
        }}>
          {/* 主信息卡片 - 纯白色背景，减少内边距 */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 24,
            paddingTop: 20,
            paddingBottom: 2,
            paddingHorizontal: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 6,
            borderWidth: 1,
            borderColor: 'rgba(0, 0, 0, 0.05)',
          }}>
            {/* 头像区域 - 减少边距 */}
            <View style={{
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <View style={{
                padding: 4,
                borderRadius: 60,
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                shadowColor: '#667eea',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 3,
              }}>
                <Avatar
                  size={100}
                  name={user?.name || '匿名用户'}
                  uri={user?.avatar}
                  style={{
                    borderWidth: 3,
                    borderColor: 'white',
                  }}
                />
              </View>
            </View>

            {/* 关注统计 - 移到头像下方 */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 36,
              marginBottom: 16,
            }}>
              <Pressable onPress={() => navigation.navigate('MyFollowing')}>
                {({ pressed }) => (
                  <View style={{
                    alignItems: 'center',
                    opacity: pressed ? 0.7 : 1,
                  }}>
                    <Text style={{
                      fontSize: 20,
                      fontWeight: '800',
                      color: COLORS.primary,
                      marginBottom: 2,
                    }}>
                      {followStats.following}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: COLORS.textSecondary,
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}>
                      关注
                    </Text>
                  </View>
                )}
              </Pressable>
              
              <Pressable onPress={() => navigation.navigate('MyFollowers')}>
                {({ pressed }) => (
                  <View style={{
                    alignItems: 'center',
                    opacity: pressed ? 0.7 : 1,
                  }}>
                    <Text style={{
                      fontSize: 20,
                      fontWeight: '800',
                      color: COLORS.primary,
                      marginBottom: 2,
                    }}>
                      {followStats.followers}
                    </Text>
                    <Text style={{
                      fontSize: 12,
                      color: COLORS.textSecondary,
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}>
                      粉丝
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* 装饰性分割线 */}
            <LinearGradient
              colors={['transparent', 'rgba(102, 126, 234, 0.2)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 1,
                marginVertical: 16, 
                marginHorizontal: -8,
              }}
            />

            {/* 用户名和基本信息 - 减少边距 */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6, 
              }}>
                <Text style={{
                  fontSize: 26, 
                  fontWeight: '900',
                  color: COLORS.text,
                  letterSpacing: -0.8,
                  textAlign: 'center',
                }}>
                  {user?.name || '匿名用户'}
                </Text>

                {user?.sex && (
                  <LinearGradient
                    colors={user?.sex === 'male' ? ['#64b5f6', '#42a5f5'] : ['#f48fb1', '#ec407a']}
                    style={{
                      marginLeft: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 15,
                    }}
                  >
                    <Ionicons
                      name={user?.sex === 'male' ? 'male' : 'female'}
                      size={14}
                      color="white"
                    />
                  </LinearGradient>
                )}
              </View>

              <Text style={{
                fontSize: 15, 
                color: COLORS.textSecondary,
                marginBottom: 10,
                fontWeight: '500',
              }}>
                {user?.email === '' ? '无邮箱' : `@${user?.email}`}
              </Text>

              <Text style={{
                fontSize: 15,
                color: COLORS.text,
                lineHeight: 22,
                textAlign: 'center',
                marginBottom: 12, 
                fontWeight: '400',
              }}>
                {user?.bio || 'hopefully be nice'}
              </Text>

              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(102, 126, 234, 0.08)',
                paddingHorizontal: 14,
                paddingVertical: 6, 
                borderRadius: 18, 
                borderWidth: 1,
                borderColor: 'rgba(102, 126, 234, 0.15)',
              }}>
                <Ionicons name="calendar-outline" size={15} color={COLORS.textSecondary} />
                <Text style={{
                  fontSize: 13, 
                  color: COLORS.textSecondary,
                  marginLeft: 6,
                  fontWeight: '500',
                }}>
                  {new Date(user?.created_at).toLocaleDateString('zh-CN') ?? '2025年1月'} 加入
                </Text>
              </View>
            </View>

            {/* 装饰性分割线 */}
            <LinearGradient
              colors={['transparent', 'rgba(102, 126, 234, 0.2)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 1,
                marginVertical: 16,
                marginHorizontal: -8,
              }}
            />

            {/* 数据统计 - 移到卡片最下方 */}
            <View style={{
              marginBottom: 6,
            }}>   
              <View style={{
                flexDirection: 'row',
                gap: 8,
              }}>
                <PremiumStatItem
                  label="发布"
                  value={userStats.posts}
                  color="#667eea"
                />
                <PremiumStatItem
                  label="评论"
                  value={userStats.comments}
                  color="#f093fb"
                />
                <PremiumStatItem
                  label="标记"
                  value={userStats.marks || 0}
                  color="#4facfe"
                />
                <PremiumStatItem
                  label="加入"
                  value={diffInDays(user?.created_at?.split("T")[0])}
                  subtitle="天"
                  color="#43e97b"
                />
              </View>
            </View>
          </View>
        </View>

        {/* 功能菜单 */}
        <View style={{
          marginTop: 32,
          paddingBottom: 20,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: COLORS.text,
            marginBottom: 20,
            textAlign: 'center',
            letterSpacing: -0.3,
          }}>
            我的内容
          </Text>
          
          <PremiumMenuItem
            title="我的帖子"
            subtitle="查看和管理我的帖子"
            icon="document-text-outline"
            onPress={handleMyPosts}
            gradient={['#667eea', '#764ba2']}
          />
          <PremiumMenuItem
            title="我的评论"
            subtitle="查看我的评论记录"
            icon="chatbubble-outline"
            onPress={handleMyComments}
            gradient={['#f093fb', '#f5576c']}
          />
          <PremiumMenuItem
            title="我的标记"
            subtitle="查看我收藏的精彩内容"
            icon="bookmark-outline"
            onPress={() => navigation.navigate('MyMarks')}
            gradient={['#4facfe', '#00f2fe']}
          />
          <PremiumMenuItem
            title="关于我"
            subtitle="我的发帖统计和心情分析"
            icon="analytics-outline"
            onPress={() => navigation.navigate('Insights')}
            gradient={['#43e97b', '#38f9d7']}
          />
        </View>

        {/* 设置选项 */}
        <View style={{
          marginTop: 20,
          paddingBottom: 20,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: COLORS.text,
            marginBottom: 20,
            textAlign: 'center',
            letterSpacing: -0.3,
          }}>
            设置
          </Text>
          
          <PremiumMenuItem
            title="消息中心"
            subtitle="查看系统通知和评论提醒"
            icon="mail-outline"
            onPress={() => navigation.navigate('MessageCenter')}
            gradient={['#fa709a', '#fee140']}
          />
        </View>

        {/* 退出登录 */}
        <View style={{
          marginHorizontal: 20,
          marginTop: 20,
          marginBottom: 100,
        }}>
          <Pressable onPress={handleLogout}>
            {({ pressed }) => (
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.08)', 'rgba(220, 38, 38, 0.05)']}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 18,
                  paddingHorizontal: 20,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                  opacity: pressed ? 0.8 : 1,
                }}
              >
                <Ionicons name="log-out-outline" size={20} color={COLORS.error} style={{ marginRight: 12 }} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: COLORS.error,
                }}>
                  退出登录
                </Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};



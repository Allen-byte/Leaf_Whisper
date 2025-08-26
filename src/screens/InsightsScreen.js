import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { useToastContext } from '../contexts/ToastContext';
import { getUserInsights } from '../services/onlineOnlyStorage';
import { MoodRadarChart } from '../components/charts/MoodRadarChart';
import { HeatmapChart } from '../components/charts/HeatmapChart';
import { PrivacyStatsChart } from '../components/charts/PrivacyStatsChart';
import GradientCard from '../components/ui/gradientCard';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

export const InsightsScreen = ({ navigation }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, isLoggedIn } = useUser();
  const { showError } = useToastContext();

  // 多个动画值
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoggedIn) {
      showError('请先登录');
      navigation.goBack();
      return;
    }

    loadInsights();
  }, [isLoggedIn]);

  useEffect(() => {
    if (insights) {
      // 复杂的入场动画序列
      Animated.sequence([
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
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // 持续的旋转动画
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [insights]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const data = await getUserInsights();
      setInsights(data);
    } catch (error) {
      console.error('加载洞察数据失败:', error);
      showError('加载数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.modernHeader}>
            <Pressable
              style={styles.modernBackButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.modernHeaderTitle}>关于你</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Animated.View style={[styles.loadingIcon, {
              transform: [{
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }]
            }]}>
              <Ionicons name="analytics" size={60} color="#fff" />
            </Animated.View>
            <Text style={styles.modernLoadingText}>正在分析您的数据...</Text>
            <Text style={styles.loadingSubtext}>🔍 挖掘您的创作模式</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.modernHeader}>
          <Pressable
            style={styles.modernBackButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.modernHeaderTitle}>关于你</Text>
          <Animated.View style={[styles.headerIcon, {
            transform: [{
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              })
            }]
          }]}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </Animated.View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={['#fff']}
            />
          }
        >
          <Animated.View style={[styles.content, { 
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }]}>
            {/* 欢迎卡片 */}
            <GradientCard style={styles.welcomeCard}>
              <View style={styles.welcomeContent}>
                <Animated.View style={[styles.welcomeIcon, {
                  transform: [{
                    scale: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1]
                    })
                  }]
                }]}>
                  <Text style={styles.welcomeEmoji}>🎯</Text>
                </Animated.View>
                <Text style={styles.welcomeTitle}>你好，{user?.name || '创作者'}！</Text>
                <Text style={styles.welcomeSubtitle}>让我们一起探索你的创作足迹 ✨</Text>
              </View>
            </GradientCard>

            {/* 总览统计卡片 */}
            <Animated.View style={[styles.statsContainer, {
              transform: [{
                scale: bounceAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1]
                })
              }]
            }]}>
              <LinearGradient
                colors={['#ff9a9e', '#fecfef', '#fecfef']}
                style={styles.statCard}
              >
                <View style={styles.statContent}>
                  <Text style={styles.statEmoji}>📝</Text>
                  <Text style={styles.statValue}>{insights?.recentPostsCount || 0}</Text>
                  <Text style={styles.statLabel}>近30天新帖</Text>
                </View>
              </LinearGradient>

              <LinearGradient
                colors={['#a8edea', '#fed6e3']}
                style={styles.statCard}
              >
                <View style={styles.statContent}>
                  <Text style={styles.statEmoji}>📊</Text>
                  <Text style={styles.statValue}>{insights?.avgContentLength || 0}</Text>
                  <Text style={styles.statLabel}>平均字数</Text>
                </View>
              </LinearGradient>

              <LinearGradient
                colors={['#ffecd2', '#fcb69f']}
                style={styles.statCard}
              >
                <View style={styles.statContent}>
                  <Text style={styles.statEmoji}>🎨</Text>
                  <Text style={styles.statValue}>{insights?.totalPostsCount || 0}</Text>
                  <Text style={styles.statLabel}>总创作数</Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* 心情雷达图 */}
            {insights?.moodRadar && insights.moodRadar.length > 0 && (
              <Animated.View style={[styles.modernChartCard, {
                transform: [{
                  scale: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1]
                  })
                }]
              }]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                  style={styles.chartCardGradient}
                >
                  <View style={styles.chartHeader}>
                    <View style={styles.chartTitleContainer}>
                      <LinearGradient
                        colors={['#ff6b6b', '#ee5a24']}
                        style={styles.chartIconBg}
                      >
                        <Ionicons name="happy" size={20} color="#fff" />
                      </LinearGradient>
                      <View>
                        <Text style={styles.modernChartTitle}>心情雷达图</Text>
                        <Text style={styles.modernChartSubtitle}>近30天情感分布</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.chartContainer}>
                    <MoodRadarChart data={insights.moodRadar} />
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* 隐私统计 */}
            {insights?.privacyStats && (
              <Animated.View style={[styles.modernChartCard, {
                transform: [{
                  scale: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1]
                  })
                }]
              }]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                  style={styles.chartCardGradient}
                >
                  <View style={styles.chartHeader}>
                    <View style={styles.chartTitleContainer}>
                      <LinearGradient
                        colors={['#a29bfe', '#6c5ce7']}
                        style={styles.chartIconBg}
                      >
                        <Ionicons name="shield" size={20} color="#fff" />
                      </LinearGradient>
                      <View>
                        <Text style={styles.modernChartTitle}>隐私偏好</Text>
                      </View>
                    </View>
                  </View>
                  <PrivacyStatsChart data={insights.privacyStats} />
                </LinearGradient>
              </Animated.View>
            )}

            {/* 发帖热力图 */}
            {insights?.dailyHeatmap && insights.dailyHeatmap.length > 0 && (
              <Animated.View style={[styles.modernChartCard, {
                transform: [{
                  scale: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1]
                  })
                }]
              }]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                  style={styles.chartCardGradient}
                >
                  <View style={styles.chartHeader}>
                    <View style={styles.chartTitleContainer}>
                      <LinearGradient
                        colors={['#00b894', '#00cec9']}
                        style={styles.chartIconBg}
                      >
                        <Ionicons name="calendar" size={20} color="#fff" />
                      </LinearGradient>
                      <View>
                        <Text style={styles.modernChartTitle}>活跃热力图</Text>
                        <Text style={styles.modernChartSubtitle}>🔥 近30天创作热度</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.chartContainer}>
                    <HeatmapChart data={insights.dailyHeatmap} />
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* 时间模式分析 */}
            {insights?.timePattern && insights.timePattern.length > 0 && (
              <Animated.View style={[styles.modernChartCard, {
                transform: [{
                  scale: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1]
                  })
                }]
              }]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                  style={styles.chartCardGradient}
                >
                  <View style={styles.chartHeader}>
                    <View style={styles.chartTitleContainer}>
                      <LinearGradient
                        colors={['#fd79a8', '#e84393']}
                        style={styles.chartIconBg}
                      >
                        <Ionicons name="time" size={20} color="#fff" />
                      </LinearGradient>
                      <View>
                        <Text style={styles.modernChartTitle}>时间偏好</Text>
                        <Text style={styles.modernChartSubtitle}>⏰ 一天中的活跃时段</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.modernTimePatternContainer}>
                    {insights.timePattern.map((item, index) => (
                      <Animated.View 
                        key={index} 
                        style={[styles.modernTimePatternItem, {
                          transform: [{
                            scale: bounceAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1]
                            })
                          }]
                        }]}
                      >
                        <Text style={styles.modernTimePatternHour}>{item.hour}:00</Text>
                        <View style={styles.modernTimePatternBar}>
                          <LinearGradient
                            colors={['#fd79a8', '#e84393']}
                            style={[
                              styles.modernTimePatternFill,
                              {
                                width: `${(item.count / Math.max(...insights.timePattern.map(t => t.count))) * 100}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.modernTimePatternCount}>{item.count}</Text>
                      </Animated.View>
                    ))}
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* 数据为空时的提示 */}
            {(!insights || (
              (!insights.moodRadar || insights.moodRadar.length === 0) &&
              (!insights.privacyStats || insights.privacyStats.total === 0) &&
              (!insights.dailyHeatmap || insights.dailyHeatmap.length === 0)
            )) && (
              <Animated.View style={[styles.modernEmptyState, {
                opacity: fadeAnim,
                transform: [{
                  scale: scaleAnim
                }]
              }]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                  style={styles.emptyStateGradient}
                >
                  <Animated.View style={[styles.emptyIcon, {
                    transform: [{
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      })
                    }]
                  }]}>
                    <Text style={styles.emptyEmoji}>🌱</Text>
                  </Animated.View>
                  <Text style={styles.modernEmptyTitle}>开始你的创作之旅</Text>
                  <Text style={styles.modernEmptySubtitle}>
                    发布更多帖子，让我们为你生成专属的数据洞察！✨
                  </Text>
                  <Pressable 
                    style={styles.createButton}
                    onPress={() => navigation.navigate('Tabs', { screen: 'Create' })}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.createButtonGradient}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                      <Text style={styles.createButtonText}>开始创作</Text>
                    </LinearGradient>
                  </Pressable>
                </LinearGradient>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 现代化头部
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 10,
  },
  modernBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  modernHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 加载状态
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingIcon: {
    marginBottom: 20,
  },
  modernLoadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  
  // 滚动视图
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    padding: 20,
  },
  
  // 欢迎卡片
  welcomeCard: {
    marginBottom: 20,
    padding: 25,
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeIcon: {
    marginBottom: 15,
  },
  welcomeEmoji: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // 统计卡片容器
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  statContent: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // 现代化图表卡片
  modernChartCard: {
    marginBottom: 25,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  chartCardGradient: {
    borderRadius: 24,
    padding: 25,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modernChartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  modernChartSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  chartContainer: {
    alignItems: 'center',
  },
  
  // 现代化时间模式
  modernTimePatternContainer: {
    paddingVertical: 15,
  },
  modernTimePatternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 5,
  },
  modernTimePatternHour: {
    width: 60,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  modernTimePatternBar: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  modernTimePatternFill: {
    height: '100%',
    borderRadius: 6,
  },
  modernTimePatternCount: {
    width: 35,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  
  // 现代化空状态
  modernEmptyState: {
    marginTop: 40,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  emptyStateGradient: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 60,
  },
  modernEmptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modernEmptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  createButton: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  decorationText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
});
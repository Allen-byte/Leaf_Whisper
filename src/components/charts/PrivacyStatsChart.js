import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

export const PrivacyStatsChart = ({ data }) => {
  const animationValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  if (!data || data.total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无数据</Text>
      </View>
    );
  }

  const anonymousRatio = data.anonymous / data.total;
  const publicRatio = data.public / data.total;

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {/* 匿名帖子部分 */}
        <Animated.View
          style={[
            styles.segment,
            styles.anonymousSegment,
            {
              flex: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, anonymousRatio],
              }),
            },
          ]}
        >
          <View style={styles.segmentContent}>
            <Text style={styles.segmentIcon}>🎭</Text>
            <Text style={styles.segmentLabel}>匿名</Text>
            <Text style={styles.segmentValue}>{data.anonymous}</Text>
          </View>
        </Animated.View>

        {/* 公开帖子部分 */}
        <Animated.View
          style={[
            styles.segment,
            styles.publicSegment,
            {
              flex: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, publicRatio],
              }),
            },
          ]}
        >
          <View style={styles.segmentContent}>
            <Text style={styles.segmentIcon}>🌟</Text>
            <Text style={styles.segmentLabel}>公开</Text>
            <Text style={styles.segmentValue}>{data.public}</Text>
          </View>
        </Animated.View>
      </View>

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>总帖子数</Text>
          <Text style={styles.statValue}>{data.total}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>匿名比例</Text>
          <Text style={styles.statValue}>{(anonymousRatio * 100).toFixed(1)}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>公开比例</Text>
          <Text style={styles.statValue}>{(publicRatio * 100).toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  emptyContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  segment: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  anonymousSegment: {
    backgroundColor: '#FF6B6B',
  },
  publicSegment: {
    backgroundColor: '#4ECDC4',
  },
  segmentContent: {
    alignItems: 'center',
  },
  segmentIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  segmentLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  segmentValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
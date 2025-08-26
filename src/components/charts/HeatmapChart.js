import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const HeatmapChart = ({ data }) => {
  const animationValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, []);

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无数据</Text>
      </View>
    );
  }

  // 获取最大值用于计算颜色强度
  const maxCount = Math.max(...data.map(d => d.count));
  
  // 获取颜色强度
  const getIntensity = (count) => {
    if (count === 0) return 0;
    return Math.max(0.1, count / maxCount);
  };

  // 获取颜色
  const getColor = (count) => {
    const intensity = getIntensity(count);
    if (count === 0) return '#f0f0f0';
    
    // 使用主题色 #45B7D1 的不同透明度
    const alpha = Math.max(0.2, intensity);
    return `rgba(69, 183, 209, ${alpha})`;
  };

  // 按周分组数据
  const groupByWeeks = () => {
    const weeks = [];
    let currentWeek = [];
    
    data.forEach((day, index) => {
      currentWeek.push(day);
      
      // 每7天或到达最后一个元素时创建新周
      if (currentWeek.length === 7 || index === data.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    return weeks;
  };

  const weeks = groupByWeeks();
  const cellSize = (width - 80) / 7; // 减去padding，除以7天

  return (
    <View style={styles.container}>
      {/* 星期标签 */}
      <View style={styles.weekLabels}>
        <Text style={styles.weekLabel}>日</Text>
        <Text style={styles.weekLabel}>一</Text>
        <Text style={styles.weekLabel}>二</Text>
        <Text style={styles.weekLabel}>三</Text>
        <Text style={styles.weekLabel}>四</Text>
        <Text style={styles.weekLabel}>五</Text>
        <Text style={styles.weekLabel}>六</Text>
      </View>

      {/* 热力图网格 */}
      <View style={styles.heatmapContainer}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const dayData = week[dayIndex];
              const delay = (weekIndex * 7 + dayIndex) * 50; // 错开动画时间
              
              return (
                <Animated.View
                  key={dayIndex}
                  style={[
                    styles.dayCell,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: dayData ? getColor(dayData.count) : '#f0f0f0',
                      transform: [
                        {
                          scale: animationValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {dayData && dayData.count > 0 && (
                    <Text style={[
                      styles.dayText,
                      { color: dayData.count > maxCount * 0.5 ? '#fff' : '#333' }
                    ]}>
                      {dayData.count}
                    </Text>
                  )}
                </Animated.View>
              );
            })}
          </View>
        ))}
      </View>

      {/* 图例 */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>少</Text>
        <View style={styles.legendScale}>
          {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
            <View
              key={index}
              style={[
                styles.legendCell,
                {
                  backgroundColor: intensity === 0 
                    ? '#f0f0f0' 
                    : `rgba(69, 183, 209, ${Math.max(0.2, intensity)})`,
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.legendLabel}>多</Text>
      </View>

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>总天数</Text>
          <Text style={styles.statValue}>{data.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>活跃天数</Text>
          <Text style={styles.statValue}>{data.filter(d => d.count > 0).length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>最高单日</Text>
          <Text style={styles.statValue}>{maxCount}</Text>
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
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  weekLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  heatmapContainer: {
    marginBottom: 20,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 3,
    paddingHorizontal: 5,
  },
  dayCell: {
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
  },
  dayText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  legendLabel: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 8,
  },
  legendScale: {
    flexDirection: 'row',
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
    color: '#45B7D1',
  },
});
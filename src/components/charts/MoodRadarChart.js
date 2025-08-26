import React from 'react';
import {
  View,
  Dimensions,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import Svg, {
  Polygon,
  Circle,
  Text as SvgText,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

const { width } = Dimensions.get('window');
const chartSize = width * 0.75;         // 整体缩小一点
const center = chartSize / 2;
const maxRadius = center * 0.55;        // 雷达范围再缩 55%

export const MoodRadarChart = ({
  data,
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'],
}) => {
  const isDark = useColorScheme() === 'dark';

  if (!data || data.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        <Svg width={chartSize} height={chartSize}>
          <SvgText
            x={center}
            y={center}
            textAnchor="middle"
            fontSize="16"
            fill={isDark ? '#aaa' : '#666'}
          >
            暂无数据
          </SvgText>
        </Svg>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.count));
  const angleStep = (2 * Math.PI) / data.length;

  const getPolygonPoints = (radius) =>
    data
      .map((_, index) => {
        const angle = -Math.PI / 2 + index * angleStep;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');

  const dataPoints = data.map((item, index) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const radius = (item.count / maxValue) * maxRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y, angle, radius, ...item };
  });

  const dataPolygonPoints = dataPoints
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
      <Svg width={chartSize} height={chartSize}>
        <Defs>
          {/* 渐变填充 */}
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#45B7D1" stopOpacity={isDark ? 0.9 : 0.7} />
            <Stop offset="100%" stopColor="#4ECDC4" stopOpacity={isDark ? 0.5 : 0.3} />
          </LinearGradient>
        </Defs>

        {/* 毛玻璃网格 */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => (
          <Polygon
            key={i}
            points={getPolygonPoints(maxRadius * ratio)}
            fill="none"
            stroke={isDark ? '#444' : '#E5E5E5'}
            strokeOpacity={0.3 + i * 0.1}
            strokeWidth={i === 4 ? 1.5 : 1}
          />
        ))}

        {/* 轴线 */}
        {data.map((_, i) => {
          const a = -Math.PI / 2 + i * angleStep;
          const ex = center + maxRadius * Math.cos(a);
          const ey = center + maxRadius * Math.sin(a);
          return (
            <Line
              key={i}
              x1={center}
              y1={center}
              x2={ex}
              y2={ey}
              stroke={isDark ? '#555' : '#E5E5E5'}
              strokeWidth={1}
            />
          );
        })}

        {/* 发光描边 + 渐变填充 */}
        <Polygon
          points={dataPolygonPoints}
          fill="url(#grad)"
          stroke="#fff"
          strokeWidth={1}
        />
        <Polygon
          points={dataPolygonPoints}
          fill="none"
          stroke={isDark ? '#00E5FF' : '#45B7D1'}
          strokeWidth={2}
          strokeOpacity={0.6}
        />

        {/* 立体数据点 */}
        {dataPoints.map((p, i) => (
          <React.Fragment key={i}>
            <Circle
              cx={p.x}
              cy={p.y}
              r="7"
              fill={colors[i % colors.length]}
              fillOpacity={isDark ? 0.4 : 0.3}
            />
            <Circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#fff"
              stroke={colors[i % colors.length]}
              strokeWidth="2"
            />
          </React.Fragment>
        ))}

        {/* 标签 */}
        {data.map((item, i) => {
          const a = -Math.PI / 2 + i * angleStep;
          const labelR = maxRadius + 22;
          const labelX = center + labelR * Math.cos(a);
          const labelY = center + labelR * Math.sin(a);
          return (
            <React.Fragment key={i}>
              <SvgText
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fontSize={12}
                fontWeight="600"
                fill={isDark ? '#ccc' : '#333'}
              >
                {item.mood}
              </SvgText>
              <SvgText
                x={labelX}
                y={labelY + 14}
                textAnchor="middle"
                fontSize={10}
                fill={isDark ? '#aaa' : '#666'}
              >
                {item.count} 次
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 12,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
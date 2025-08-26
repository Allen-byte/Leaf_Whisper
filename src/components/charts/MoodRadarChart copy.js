import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Polygon, Circle, Text as SvgText, Line, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const chartSize = width * 0.8;
const center = chartSize / 2;
const maxRadius = center * 0.6;

export const MoodRadarChart = ({ data, colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'] }) => {
  if (!data || data.length === 0) {
    return (
      <View style={{ width: chartSize, height: chartSize, justifyContent: 'center', alignItems: 'center' }}>
        <SvgText x={center} y={center} textAnchor="middle" fontSize="16" fill="#999">
          暂无数据
        </SvgText>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count));
  const angleStep = (2 * Math.PI) / data.length;

  const getPolygonPoints = (radius) => {
    return data.map((_, index) => {
      const angle = -Math.PI / 2 + index * angleStep;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const getDataPoints = () => {
    return data.map((item, index) => {
      const angle = -Math.PI / 2 + index * angleStep;
      const radius = (item.count / maxValue) * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { x, y, angle, radius, ...item };
    });
  };

  const dataPoints = getDataPoints();
  const dataPolygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={{ width: chartSize, height: chartSize }}>
      <Svg width={chartSize} height={chartSize}>
        {/* 背景网格 */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((ratio, index) => (
          <Polygon
            key={index}
            points={getPolygonPoints(maxRadius * ratio)}
            fill="none"
            stroke="#E5E5E5"
            strokeWidth="1"
          />
        ))}
        
        {/* 轴线 */}
        {data.map((_, index) => {
          const angle = -Math.PI / 2 + index * angleStep;
          const endX = center + maxRadius * Math.cos(angle);
          const endY = center + maxRadius * Math.sin(angle);
          return (
            <Line
              key={index}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke="#E5E5E5"
              strokeWidth="1"
            />
          );
        })}
        
        {/* 数据多边形 */}
        <Polygon
          points={dataPolygonPoints}
          fill="rgba(69, 183, 209, 0.3)"
          stroke="#45B7D1"
          strokeWidth="2"
        />
        
        {/* 数据点 */}
        {dataPoints.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={colors[index % colors.length]}
          />
        ))}
        
        {/* 标签 */}
        {data.map((item, index) => {
          const angle = -Math.PI / 2 + index * angleStep;
          const labelRadius = maxRadius + 20;
          const labelX = center + labelRadius * Math.cos(angle);
          const labelY = center + labelRadius * Math.sin(angle);
          
          return (
            <G key={index}>
              <SvgText
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fontSize="12"
                fill="#333"
                fontWeight="500"
              >
                {item.mood}
              </SvgText>
              <SvgText
                x={labelX}
                y={labelY + 14}
                textAnchor="middle"
                fontSize="10"
                fill="#666"
              >
                {item.count}次
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};
import React from 'react';
import { LinearGradient } from "expo-linear-gradient";
import { Card } from './Card';

// 放在文件顶部或单独 utils
const GradientCard = ({ children, style }) => (
    <LinearGradient
      colors={['#E6E6FA', '#FFFACD', '#FFB6C1']} // 图中渐变色
      style={[style, { borderRadius: 39 }]}      // 让圆角与 Card 一致
    >
      {/* 把背景透明，否则纯色会盖住渐变 */}
      <Card variant="flat" style={{ backgroundColor: 'transparent' }}>
        {children}
      </Card>
    </LinearGradient>
  );

export default GradientCard;
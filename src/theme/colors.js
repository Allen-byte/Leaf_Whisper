// 基础颜色定义
const lightColors = {
  bg: '#fafbfc',
  surface: '#ffffff',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  shadow: 'rgba(15, 23, 42, 0.08)',
  shadowDark: 'rgba(15, 23, 42, 0.12)',
};

const darkColors = {
  bg: '#0f172a',
  surface: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  border: '#334155',
  borderLight: '#475569',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
};

// 主题颜色选项
const themeColors = {
  '#007AFF': { // 默认蓝
    primary: '#007AFF',
    primaryLight: '#dbeafe',
    primaryDark: '#1d4ed8',
  },
  '#FF9500': { // 活力橙
    primary: '#FF9500',
    primaryLight: '#fed7aa',
    primaryDark: '#ea580c',
  },
  '#34C759': { // 自然绿
    primary: '#34C759',
    primaryLight: '#dcfce7',
    primaryDark: '#166534',
  },
  '#FF2D92': { // 浪漫粉
    primary: '#FF2D92',
    primaryLight: '#fce7f3',
    primaryDark: '#be185d',
  },
  '#5856D6': { // 深邃紫
    primary: '#5856D6',
    primaryLight: '#e0e7ff',
    primaryDark: '#4338ca',
  },
  '#FF3B30': { // 经典红
    primary: '#FF3B30',
    primaryLight: '#fee2e2',
    primaryDark: '#dc2626',
  },
  '#5AC8FA': { // 科技青
    primary: '#5AC8FA',
    primaryLight: '#cffafe',
    primaryDark: '#0891b2',
  },
  '#FFCC02': { // 温暖黄
    primary: '#FFCC02',
    primaryLight: '#fef3c7',
    primaryDark: '#d97706',
  },
};

// 功能色（不随主题变化）
const functionalColors = {
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  danger: '#a0522d',
  accent: '#f59e0b',
  girl: '#FFC0CB',
};

// 字体大小配置
const fontSizes = {
  small: 0.9,
  normal: 1.0,
  large: 1.1,
  xlarge: 1.2,
};

// 生成动态颜色主题
export const generateColors = (themeSettings = {}) => {
  const {
    darkMode = false,
    primaryColor = '#007AFF',
    highContrast = false,
  } = themeSettings;

  // 选择基础颜色
  const baseColors = darkMode ? darkColors : lightColors;
  
  // 选择主题颜色
  const selectedTheme = themeColors[primaryColor] || themeColors['#007AFF'];
  
  // 高对比度调整
  const contrastAdjustment = highContrast ? {
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#e2e8f0' : '#1e293b',
    border: darkMode ? '#64748b' : '#334155',
  } : {};

  return {
    ...baseColors,
    ...selectedTheme,
    ...functionalColors,
    ...contrastAdjustment,
    // 保留的颜色（向后兼容）
    bgLight: '#f8fafc',
    cardGradient: ['#ffffff', '#f8fafc'],
  };
};

// 默认颜色（向后兼容）
export const COLORS = generateColors();

// 字体大小工具函数
export const getFontSize = (baseSize, sizeKey = 'normal') => {
  const multiplier = fontSizes[sizeKey] || 1.0;
  return baseSize * multiplier;
};
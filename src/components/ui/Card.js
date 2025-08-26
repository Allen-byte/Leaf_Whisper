import React from 'react';
import { View, Pressable, Animated } from 'react-native';
import { COLORS } from '../../theme/colors';

// 极简卡片组件
export const Card = ({ 
  children, 
  style, 
  onPress, 
  variant = 'default',
  padding = 16,
  ...props 
}) => {
  const variants = {
    default: {
      backgroundColor: COLORS.surface,
      borderRadius: 20,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    flat: {
      backgroundColor: COLORS.surface,
      borderRadius: 20,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: 12,
    }
  };

  const cardStyle = [
    variants[variant],
    { padding },
    style
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} {...props}>
        {({ pressed }) => (
          <Animated.View 
            style={[
              cardStyle,
              { opacity: pressed ? 0.8 : 1 }
            ]}
          >
            {children}
          </Animated.View>
        )}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};
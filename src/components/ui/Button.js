import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { COLORS } from '../../theme/colors';
import { color } from 'motion';


export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary',
  size = 'medium',
  icon,
  disabled = false,
  style,
  ...props 
}) => {
  const sizes = {
    small: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
    medium: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 16 },
    large: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18 },
  };

  const variants = {
    primary: {
      backgroundColor: COLORS.primary,
      color: COLORS.surface,
    },
    secondary: {
      backgroundColor: COLORS.surface,
      color: COLORS.text,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    outline: {
      backgroundColor: 'transparent',
      color: COLORS.primary,
      borderWidth: 1,
      borderColor: COLORS.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: COLORS.primary,
    },
    text: {
      backgroundColor: 'transparent',
      color: COLORS.textSecondary,
    },
    danger: {
      backgroundColor: COLORS.danger,
      color: COLORS.surface
    }
  };

  const currentSize = sizes[size];
  const currentVariant = variants[variant];

  const buttonStyle = [
    {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
      ...currentSize,
      backgroundColor: currentVariant.backgroundColor,
      borderWidth: currentVariant.borderWidth || 0,
      borderColor: currentVariant.borderColor,
      opacity: disabled ? 0.5 : 1,
    },
    style
  ];

  return (
    <Pressable 
      onPress={disabled ? undefined : onPress} 
      style={({ pressed }) => [
        buttonStyle,
        { opacity: pressed && !disabled ? 0.8 : (disabled ? 0.5 : 1) }
      ]}
      {...props}
    >
      {icon && icon}
      <Text style={{ 
        color: currentVariant.color, 
        fontSize: currentSize.fontSize,
        fontWeight: '600'
      }}>
        {title}
      </Text>
    </Pressable>
  );
};
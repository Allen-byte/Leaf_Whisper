import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { COLORS } from '../../theme/colors';

const { width } = Dimensions.get('window');

// Toast类型
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Toast组件
export const Toast = ({ visible, message, type = TOAST_TYPES.INFO, duration = 3000, onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // 显示动画
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // 自动隐藏
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide && onHide();
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return {
          backgroundColor: '#4CAF50',
          icon: '✅',
        };
      case TOAST_TYPES.ERROR:
        return {
          backgroundColor: '#F44336',
          icon: '❌',
        };
      case TOAST_TYPES.WARNING:
        return {
          backgroundColor: '#FF9800',
          icon: '⚠️',
        };
      default:
        return {
          backgroundColor: COLORS.primary,
          icon: 'ℹ️',
        };
    }
  };

  const toastStyle = getToastStyle();

  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      zIndex: 9999,
      alignItems: 'center',
    }}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: toastStyle.backgroundColor,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 25,
          maxWidth: width - 40,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Text style={{ fontSize: 16, marginRight: 8 }}>
          {toastStyle.icon}
        </Text>
        <Text style={{
          color: 'white',
          fontSize: 14,
          fontWeight: '500',
          flex: 1,
          textAlign: 'center',
        }}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
};

// 确认对话框组件
export const ConfirmDialog = ({ 
  visible, 
  title, 
  message, 
  confirmText = '确定', 
  cancelText = '取消',
  onConfirm, 
  onCancel,
  type = 'default'
}) => {
  const getButtonColor = () => {
    switch (type) {
      case 'danger':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      default:
        return COLORS.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
      }}>
        <View style={{
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 320,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        }}>
          {title && (
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: COLORS.text,
              marginBottom: 12,
              textAlign: 'center',
            }}>
              {title}
            </Text>
          )}
          
          <Text style={{
            fontSize: 14,
            color: COLORS.textMuted,
            lineHeight: 20,
            textAlign: 'center',
            marginBottom: 24,
          }}>
            {message}
          </Text>

          <View style={{
            flexDirection: 'row',
            gap: 12,
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: COLORS.borderLight,
                alignItems: 'center',
              }}
              onPress={onCancel}
            >
              <Text style={{
                color: COLORS.textMuted,
                fontSize: 14,
                fontWeight: '600',
              }}>
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: getButtonColor(),
                alignItems: 'center',
              }}
              onPress={onConfirm}
            >
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '600',
              }}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export { TOAST_TYPES };
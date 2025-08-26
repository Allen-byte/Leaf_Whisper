import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Animated
} from 'react-native';
import { Button } from '../components/ui/Button';
import { COLORS } from '../theme/colors';
import { useToastContext } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// 创建支持动画的LinearGradient组件
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { showError, showSuccess } = useToastContext();
  const { user, login, isLoading } = useUser();

  // 为每个颜色和位置创建独立的动画值，实现不同步运动
  const colorAnim1 = useRef(new Animated.Value(0)).current;
  const colorAnim2 = useRef(new Animated.Value(0)).current;
  const colorAnim3 = useRef(new Animated.Value(0)).current;
  const startXAnim = useRef(new Animated.Value(0)).current;
  const startYAnim = useRef(new Animated.Value(0)).current;
  const endXAnim = useRef(new Animated.Value(1)).current;
  const endYAnim = useRef(new Animated.Value(1)).current;

  // 定义每个颜色独立的动画节奏（不同延迟和周期）
  useEffect(() => {
    // 颜色1动画：周期10秒
    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.timing(colorAnim1, {
          toValue: 1,
          duration: 4000,
          delay: 0,
          useNativeDriver: false,
        }),
        Animated.timing(colorAnim1, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    );

    // 颜色2动画：周期8秒，有延迟，与颜色1不同步
    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.timing(colorAnim2, {
          toValue: 1,
          duration: 6000,
          delay: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(colorAnim2, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: false,
        }),
      ])
    );

    // 颜色3动画：周期12秒，不同延迟
    const anim3 = Animated.loop(
      Animated.sequence([
        Animated.timing(colorAnim3, {
          toValue: 1,
          duration: 8000,
          delay: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(colorAnim3, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: false,
        }),
      ])
    );

    // 渐变起点动画
    const startAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(startXAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: false,
        }),
        Animated.timing(startXAnim, {
          toValue: 0,
          duration: 10000,
          useNativeDriver: false,
        }),
      ])
    );

    // 渐变终点动画
    const endAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(endYAnim, {
          toValue: 0,
          duration: 12000,
          useNativeDriver: false,
        }),
        Animated.timing(endYAnim, {
          toValue: 1,
          duration: 12000,
          useNativeDriver: false,
        }),
      ])
    );

    // 启动所有动画
    anim1.start();
    anim2.start();
    anim3.start();
    startAnim.start();
    endAnim.start();

    // 组件卸载时清理
    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
      startAnim.stop();
      endAnim.stop();
    };
  }, []);

  // 每个颜色有独立的变化范围，保持你喜欢的色调
  const color1 = colorAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['#B19CD9', '#F0E6FA'] // 紫调变化
  });

  const color2 = colorAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFACD', '#FFDAB9'] // 黄调变化
  });

  const color3 = colorAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FF8C94', '#FFE6E6'] // 粉调变化
  });

  // 渐变位置动态变化，增强流动感
  const startX = startXAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5]
  });

  const endY = endYAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1]
  });

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showError('请输入用户名和密码');
      return;
    }

    try {
      const result = await login(username.trim(), password);

      if (result.success) {
        showSuccess('登录成功，欢迎回来！');
        setTimeout(() => {
          navigation.replace('Tabs');
        }, 800);
      }
    } catch (error) {
      console.error('登录错误:', error);
      showError(error.message || '网络错误，请重试');
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <AnimatedLinearGradient
      colors={[color1, color2, color3]}
      start={{ x: startX, y: startYAnim }}
      end={{ x: endXAnim, y: endY }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

          <View style={{ flex: 1 }}>
            {/* 顶部标题区域 */}
            <View style={{
              height: 200,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <View style={{ alignItems: 'center', width: '90%' }}>
                <Text style={{
                  fontSize: 32,
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: 8,
                  fontStyle: 'italic',
                  letterSpacing: 1.3,
                  width: '100%',
                }}>
                  Leaf · Whisper
                </Text>
                <Text style={{
                  fontSize: 20,
                  fontWeight: '600',
                  color: '#fff',
                  textAlign: 'right',
                  marginTop: 4,
                  width: '100%',
                  fontStyle: 'italic',
                }}>
                  Continue Our Journey
                </Text>
              </View>
            </View>

            {/* 登录表单区域 */}
            <View style={{
              flex: 1,
              paddingHorizontal: 24,
              paddingTop: 40,
              justifyContent: 'center',
            }}>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 36,
                padding: 32,
              }}>
                <View style={{ marginBottom: 32 }}>
                  <Text style={{
                    fontSize: 28,
                    fontWeight: '700',
                    color: COLORS.textSecondary,
                    marginBottom: 8,
                    textAlign: 'center',
                  }}>
                    许久未见
                  </Text>
                </View>

                <View style={{ gap: 24, marginBottom: 32 }}>
                  {/* 用户名输入 */}
                  <View>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: COLORS.text,
                      marginBottom: 8
                    }}>
                      用户名
                    </Text>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: COLORS.bg,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: COLORS.borderLight,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                    }}>
                      <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={{ marginRight: 12 }} />
                      <TextInput
                        value={username}
                        onChangeText={setUsername}
                        placeholder="请输入用户名"
                        placeholderTextColor={COLORS.textMuted}
                        style={{
                          flex: 1,
                          fontSize: 16,
                          color: COLORS.text,
                          padding: 0
                        }}
                      />
                    </View>
                  </View>

                  {/* 密码输入 */}
                  <View>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: COLORS.text,
                      marginBottom: 8
                    }}>
                      密码
                    </Text>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: COLORS.bg,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: COLORS.borderLight,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                    }}>
                      <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={{ marginRight: 12 }} />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="请输入密码"
                        placeholderTextColor={COLORS.textMuted}
                        secureTextEntry
                        style={{
                          flex: 1,
                          fontSize: 16,
                          color: COLORS.text,
                          padding: 0
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* 登录按钮 */}
                <Button
                  title={isLoading ? "登录中..." : "Get Started"}
                  variant="primary"
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={{
                    marginBottom: 24,
                    borderRadius: 16,
                    paddingVertical: 16,
                    backgroundColor: '#6B46C1',
                  }}
                />

                {/* 注册提示 */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: 16,
                }}>
                  <Text style={{
                    color: COLORS.textMuted,
                    fontSize: 15,
                    marginRight: 4,
                  }}>
                    还没有账号？
                  </Text>
                  <Pressable onPress={handleRegister}>
                    <Text style={{
                      color: '#6B46C1',
                      fontSize: 15,
                      fontWeight: '600',
                    }}>
                      立即注册
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </AnimatedLinearGradient>
  );
};

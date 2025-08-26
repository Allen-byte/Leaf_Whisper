import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Pressable
} from 'react-native';
import { Button } from '../components/ui/Button';
import { COLORS } from '../theme/colors';
import { useToastContext } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ConfirmDialog } from '../components/ui/Toast'; // 添加导入

// 创建可动画的LinearGradient组件
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [sex, setSex] = useState('male');
  // 添加自定义提示框状态
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const { showError, showSuccess } = useToastContext();
  const { register, isLoading } = useUser();

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

  // 每个颜色有独立的变化范围
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

  // 根据性别设置默认头像
  const getDefaultAvatar = (selectedSex) => {
    return selectedSex === 'female' ? 'assets/images/default_girl.png' : 'assets/images/default_boy.png';
  };

  const handleSexChange = (selectedSex) => {
    setSex(selectedSex);
  };

  // 检查用户名是否包含中文字符
  const containsChinese = (str) => {
    return /[\u4e00-\u9fa5]/.test(str);
  };

  // 检查用户名是否只包含字母和数字
  const isValidUsername = (str) => {
    return /^[a-zA-Z0-9]+$/.test(str);
  };

  const handleRegister = async () => {
    // 表单验证
    if (!username.trim()) {
      showError('请输入用户名');
      return;
    }

    // 检查用户名是否包含中文字符
    if (containsChinese(username) || !isValidUsername(username)) {
      setShowUsernameDialog(true);
      return;
    }

    if (!nickname.trim()) {
      showError('请输入昵称');
      return;
    }
    if (!password.trim()) {
      showError('请输入密码');
      return;
    }
    if (password !== confirmPassword) {
      showError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      showError('密码长度至少6位');
      return;
    }

    try {
      const result = await register({
        username: username.trim(),
        password,
        name: nickname.trim(),
        bio: '',
        avatar: getDefaultAvatar(sex),
        sex: sex
      });

      if (result.success) {
        showSuccess('注册成功，欢迎加入LeafWhisper！');
        setTimeout(() => {
          navigation.replace('Tabs');
        }, 1000);
      }
    } catch (error) {
      console.error('注册错误:', error);
      showError(error.message || '网络错误，请重试');
    }
  };

  // 处理用户名提示框确认
  const handleUsernameDialogConfirm = () => {
    setShowUsernameDialog(false);
    // 清空用户名输入框
    setUsername('');
  };

  // 处理用户名提示框取消
  const handleUsernameDialogCancel = () => {
    setShowUsernameDialog(false);
  };

  const handleLogin = () => {
    navigation.navigate('Login');
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
        <ScrollView>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* 顶部标题区域 */}
              <View style={{
                height: 180,
                justifyContent: 'center',
                alignItems: 'center',
                // paddingTop: 40,
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
                    Join Our Journey
                  </Text>
                </View>
              </View>

              {/* 注册表单区域 */}
              <View style={{
                paddingHorizontal: 24,
                paddingBottom: 40,
              }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: 24,
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
                      Hi! 新朋友
                    </Text>
                  </View>

                  {/* 保持原有的表单字段内容 */}
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
                      autoCapitalize="none"
                      style={{
                        flex: 1,
                        color: COLORS.text,
                        fontSize: 16,
                        padding: 0
                      }}
                    />
                  </View>
                </View>

                {/* 昵称输入 */}
                <View style={{ marginTop: 30 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: COLORS.text,
                    marginBottom: 8
                  }}>
                    昵称
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
                    <Ionicons name="happy-outline" size={20} color={COLORS.textMuted} style={{ marginRight: 12 }} />
                    <TextInput
                      value={nickname}
                      onChangeText={setNickname}
                      placeholder="请输入昵称"
                      placeholderTextColor={COLORS.textMuted}
                      style={{
                        flex: 1,
                        color: COLORS.text,
                        fontSize: 16,
                        padding: 0
                      }}
                    />
                  </View>
                </View>

                {/* 性别选择 */}
                <View style={{ marginTop: 10 }}>

                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: COLORS.text,
                    marginBottom: 8
                  }}>
                    性别
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable
                      onPress={() => handleSexChange('male')}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: sex === 'male' ? COLORS.primaryLight : COLORS.bg,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: sex === 'male' ? COLORS.primary : COLORS.borderLight,
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                      }}
                    >
                      <Ionicons
                        name={sex === 'male' ? 'male' : 'male-outline'}
                        size={20}
                        color={sex === 'male' ? COLORS.primary : COLORS.textMuted}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={{
                        color: sex === 'male' ? COLORS.primary : COLORS.textMuted,
                        fontSize: 16,
                        fontWeight: sex === 'male' ? '600' : '400'
                      }}>
                        男
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleSexChange('female')}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: sex === 'female' ? COLORS.primaryLight : COLORS.bg,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: sex === 'female' ? COLORS.girl : COLORS.borderLight,
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                      }}
                    >
                      <Ionicons
                        name={sex === 'female' ? 'female' : 'female-outline'}
                        size={20}
                        color={sex === 'female' ? COLORS.girl : COLORS.textMuted}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={{
                        color: sex === 'female' ? COLORS.girl : COLORS.textMuted,
                        fontSize: 16,
                        fontWeight: sex === 'female' ? '600' : '400'
                      }}>
                        女
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* 密码输入 */}
                <View style={{ marginTop: 10 }}>

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
                      placeholder="请输入密码（至少6位）"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry
                      style={{
                        flex: 1,
                        color: COLORS.text,
                        fontSize: 16,
                        padding: 0
                      }}
                    />
                  </View>
                </View>

                {/* 确认密码输入 */}
                <View style={{ marginTop: 10 }}>

                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: COLORS.text,
                    marginBottom: 8
                  }}>
                    确认密码
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
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="请再次输入密码"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry
                      style={{
                        flex: 1,
                        color: COLORS.text,
                        fontSize: 16,
                        padding: 0
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* 注册按钮 */}
              <View style={{ alignItems: 'center' }}>

                <Button
                  title={isLoading ? "注册中..." : "Get Started"}
                  variant="primary"
                  onPress={handleRegister}
                  disabled={isLoading}
                  style={{
                    marginBottom: 24,
                    borderRadius: 16,
                    paddingVertical: 16,
                    backgroundColor: '#6B46C1',
                    width: '50%'
                  }}
                />
              </View>

              {/* 登录提示 */}
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
                  已有账号？
                </Text>
                <Pressable onPress={handleLogin}>
                  <Text style={{
                    color: '#6B46C1',
                    fontSize: 15,
                    fontWeight: '600',
                  }}>
                    立即登录
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* 自定义用户名提示框 */}
      <ConfirmDialog
        visible={showUsernameDialog}
        title="格式不对🤔"
        message="用户名由英文字母和数字组成"
        confirmText="晓得了"
        type="warning"
        onConfirm={handleUsernameDialogConfirm}
        onCancel={handleUsernameDialogCancel}
      />
    </AnimatedLinearGradient>
  );
};
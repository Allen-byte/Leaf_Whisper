import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { COLORS } from '../theme/colors';
import { uploadAvatar, uploadBackground, updateUserProfile } from '../services/onlineOnlyStorage';
import * as ImagePicker from 'expo-image-picker';
import { useToastContext } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundImage } from '../components/ui/BackgroundImage';

export const EditProfileScreen = ({ navigation, route }) => {
  const { user, updateUser } = useUser();

  const [name, setName] = useState(user?.name || '匿名用户');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [email, setEmail] = useState(user?.email || '');
  const [backgroundImage, setBackgroundImage] = useState(user?.background_image || '');
  const [sex, setSex] = useState(user?.sex || 'male');
  const [uploading, setUploading] = useState(false);
  const { showError, showSuccess, showConfirm } = useToastContext();

  // 根据性别设置默认头像
  const getDefaultAvatar = (selectedSex) => {
    return selectedSex === 'female' ? 'assets/images/default_girl.png' : 'assets/images/default_boy.png';
  };

  const handleSexChange = (selectedSex) => {
    setSex(selectedSex);
    // setAvatar(getDefaultAvatar(selectedSex));
  };


  const handleSave = async () => {
    if (name.trim().length === 0) {
      showError('请输入昵称');
      return;
    }

    // 验证邮箱格式
    if (email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        showError('请输入正确的邮箱格式');
        return;
      }
    }

    setUploading(true);

    try {
      let finalAvatarPath = avatar;
      let finalBackgroundPath = backgroundImage;

      // 如果选择了本地头像图片，先上传头像
      if (avatar && (avatar.startsWith('file://') || avatar.startsWith('content://'))) {
        try {
          const uploadResult = await uploadAvatar(avatar);
          finalAvatarPath = uploadResult.avatarPath;
        } catch (uploadError) {
          console.error('头像上传失败:', uploadError);
          showError('头像上传失败，请重试');
          setUploading(false);
          return;
        }
      }

      // 如果选择了本地背景图片，先上传背景图
      if (backgroundImage && (backgroundImage.startsWith('file://') || backgroundImage.startsWith('content://'))) {
        try {
          const uploadResult = await uploadBackground(backgroundImage);
          finalBackgroundPath = uploadResult.backgroundPath;
        } catch (uploadError) {
          console.error('背景图上传失败:', uploadError);
          showError('背景图上传失败，请重试');
          setUploading(false);
          return;
        }
      }

      // 更新用户资料
      const profileData = {
        name: name.trim(),
        bio: bio.trim(),
        avatar: finalAvatarPath,
        email: email.trim(),
        backgroundImage: finalBackgroundPath,
        sex: sex
      };

      await updateUser(profileData);

      showSuccess('资料更新成功！');

      // 延迟导航，让用户看到成功消息
      setTimeout(() => {
        navigation.navigate('Tabs', {
          screen: 'Profile',
          params: { shouldRefreshUser: true }
        });
      }, 1000);

    } catch (error) {
      console.error('保存失败:', error);
      showError(error.message || '保存失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 请求相册权限
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('需要相册权限来选择头像');
      return false;
    }
    return true;
  };

  // 从相册选择图片
  const pickImageFromLibrary = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // 正方形裁剪
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
        showSuccess('头像已更新！');
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      showError('选择图片失败，请重试');
    }
  };

  // 拍照选择头像
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showError('需要相机权限来拍照');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
        showSuccess('头像已更新！');
      }
    } catch (error) {
      console.error('拍照失败:', error);
      showError('拍照失败，请重试');
    }
  };

  const handleAvatarChange = () => {
    Alert.alert(
      '更换头像',
      '',
      [
        { text: '取消', style: 'cancel' },
        { text: '相册', onPress: pickImageFromLibrary },
        { text: '拍照', onPress: takePhoto },
      ]
    );
  };

  const handleBackgroundChange = () => {
    Alert.alert(
      '更换背景图',
      '',
      [
        { text: '取消', style: 'cancel' },
        { text: '相册', onPress: pickBackgroundFromLibrary },
        { text: '拍照', onPress: takeBackgroundPhoto },
      ]
    );
  };

  // 从相册选择背景图
  const pickBackgroundFromLibrary = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // 宽屏比例
        quality: 0.6,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setBackgroundImage(result.assets[0].uri);
        // showSuccess('背景图已更新！');
      }
    } catch (error) {
      console.error('选择背景图失败:', error);
      showError('选择背景图失败，请重试');
    }
  };

  // 拍照选择背景图
  const takeBackgroundPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showError('需要相机权限来拍照');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setBackgroundImage(result.assets[0].uri);
        // showSuccess('背景图已更新！');
      }
    } catch (error) {
      console.error('拍照失败:', error);
      showError('拍照失败，请重试');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }}>
      {/* 现代化顶部区域 */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>编辑资料</Text>
        <Pressable
          style={[styles.saveButton, uploading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={uploading}
        >
          <Text style={[styles.saveButtonText, uploading && styles.saveButtonTextDisabled]}>
            {uploading ? '保存中...' : '保存'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 背景图和头像区域 */}
        <View style={styles.profileSection}>
          <BackgroundImage
            imagePath={backgroundImage}
            style={styles.backgroundImage}
            imageStyle={styles.backgroundImageStyle}
          >

            {/* 背景图编辑按钮 */}
            <Pressable
              style={styles.backgroundEditButton}
              onPress={handleBackgroundChange}
            >
              <Ionicons name="camera" size={16} color="#fff" />
            </Pressable>

            {/* 头像区域 */}
            <View style={styles.avatarSection}>
              <Avatar
                uri={avatar}
                name={name}
                size={100}
                style={styles.avatar}
              />
              <Pressable
                style={styles.avatarEditButton}
                onPress={handleAvatarChange}
              >
                <Ionicons name="camera" size={20} color="#fff" />
              </Pressable>
            </View>
          </BackgroundImage>
        </View>

        {/* 表单区域 */}
        <View style={styles.formSection}>
          {/* 基本信息卡片 */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>基本信息</Text>

            {/* 昵称 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>昵称</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="请输入昵称"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.textInput}
                  maxLength={20}
                />
              </View>
            </View>

            {/* 邮箱 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>邮箱</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="请输入邮箱地址"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.textInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* 性别选择 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>性别</Text>
              <View style={styles.genderContainer}>
                <Pressable
                  style={[styles.genderOption, sex === 'male' && styles.genderOptionSelected]}
                  onPress={() => handleSexChange('male')}
                >
                  <Text style={styles.genderEmoji}>👨</Text>
                  <Text style={[styles.genderText, sex === 'male' && styles.genderTextSelected]}>
                    男生
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.genderOption, sex === 'female' && styles.genderOptionSelected]}
                  onPress={() => handleSexChange('female')}
                >
                  <Text style={styles.genderEmoji}>👩</Text>
                  <Text style={[styles.genderText, sex === 'female' && styles.genderTextSelected]}>
                    女生
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* 个人简介卡片 */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}              
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          >
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>个人简介</Text>
              <View style={styles.bioContainer}>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="写点什么介绍自己吧..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  textAlignVertical="top"
                  style={styles.bioInput}
                  maxLength={200}
                />
                <Text style={styles.charCount}>
                  {bio.length}/200
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>

          {/* 底部间距 */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingTop: 50
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: 'rgba(255,255,255,0.7)',
  },
  profileSection: {
    backgroundColor: COLORS.surface,
  },
  backgroundImage: {
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  backgroundImageStyle: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  defaultBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundEditButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    position: 'relative',
  },
  avatar: {
    borderWidth: 4,
    borderColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  formSection: {
    padding: 20,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    padding: 0,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  genderOptionSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  genderEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  genderText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  genderTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  bioContainer: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 16,
  },
  bioInput: {
    color: COLORS.text,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    padding: 0,
  },
  charCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Switch,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useToastContext } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 通知设置项组件
const NotificationSettingItem = ({ title, subtitle, value, onValueChange, icon, type = 'switch' }) => {
  if (type === 'switch') {
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
      }}>
        {/* 图标 */}
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: COLORS.primary + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 15,
        }}>
          <Ionicons name={icon} size={20} color={COLORS.primary} />
        </View>

        {/* 文本内容 */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '500',
            color: COLORS.text,
            marginBottom: subtitle ? 2 : 0,
          }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{
              fontSize: 13,
              color: COLORS.textSecondary,
              lineHeight: 18,
            }}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* 开关 */}
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: COLORS.borderLight,
            true: COLORS.primary + '40',
          }}
          thumbColor={value ? COLORS.primary : COLORS.textMuted}
          ios_backgroundColor={COLORS.borderLight}
        />
      </View>
    );
  }

  // 按钮类型的设置项
  return (
    <Pressable onPress={onValueChange}>
      {({ pressed }) => (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 20,
          backgroundColor: pressed ? COLORS.borderLight : COLORS.surface,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.borderLight,
        }}>
          {/* 图标 */}
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 15,
          }}>
            <Ionicons name={icon} size={20} color={COLORS.primary} />
          </View>

          {/* 文本内容 */}
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '500',
              color: COLORS.text,
              marginBottom: subtitle ? 2 : 0,
            }}>
              {title}
            </Text>
            {subtitle && (
              <Text style={{
                fontSize: 13,
                color: COLORS.textSecondary,
                lineHeight: 18,
              }}>
                {subtitle}
              </Text>
            )}
          </View>

          {/* 箭头 */}
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>
      )}
    </Pressable>
  );
};

// 设置分组标题组件
const SettingGroupTitle = ({ title }) => (
  <View style={{
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  }}>
    <Text style={{
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }}>
      {title}
    </Text>
  </View>
);

export const NotificationSettingsScreen = ({ navigation }) => {
  const { showSuccess, showError } = useToastContext();
  const { user } = useUser();

  // 通知设置状态
  const [settings, setSettings] = useState({
    pushNotifications: true,
    commentNotifications: true,
    likeNotifications: true,
    systemNotifications: true,
    doNotDisturb: false,
    doNotDisturbStart: '22:00',
    doNotDisturbEnd: '08:00',
  });

  // 加载保存的设置
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(`notification_settings_${user?.id}`);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('加载通知设置失败:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(`notification_settings_${user?.id}`, JSON.stringify(newSettings));
      setSettings(newSettings);
      showSuccess('设置已保存');
    } catch (error) {
      console.error('保存通知设置失败:', error);
      showError('保存设置失败');
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleDoNotDisturbTime = () => {
    Alert.alert(
      '免打扰时间',
      '当前设置：' + settings.doNotDisturbStart + ' - ' + settings.doNotDisturbEnd,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '修改',
          onPress: () => {
            // 这里可以添加时间选择器
            showSuccess('时间选择功能开发中');
          }
        }
      ]
    );
  };

  const resetToDefault = () => {
    Alert.alert(
      '重置设置',
      '确定要将所有通知设置重置为默认值吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '重置',
          style: 'destructive',
          onPress: () => {
            const defaultSettings = {
              pushNotifications: true,
              commentNotifications: true,
              likeNotifications: true,
              systemNotifications: true,
              doNotDisturb: false,
              doNotDisturbStart: '22:00',
              doNotDisturbEnd: '08:00',
            };
            saveSettings(defaultSettings);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* 顶部导航栏 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
      }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            marginRight: 15,
            padding: 5,
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: COLORS.text,
          flex: 1,
        }}>
          通知设置
        </Text>
        <Pressable onPress={resetToDefault}>
          <Text style={{
            fontSize: 14,
            color: COLORS.primary,
            fontWeight: '500',
          }}>
            重置
          </Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* 推送通知 */}
        <SettingGroupTitle title="推送通知" />
        <View style={{ backgroundColor: COLORS.surface }}>
          <NotificationSettingItem
            title="推送通知"
            subtitle="允许应用发送推送通知到设备"
            icon="notifications-outline"
            value={settings.pushNotifications}
            onValueChange={(value) => handleSettingChange('pushNotifications', value)}
          />
        </View>

        {/* 互动通知 */}
        <SettingGroupTitle title="互动通知" />
        <View style={{ backgroundColor: COLORS.surface }}>
          <NotificationSettingItem
            title="评论通知"
            subtitle="当有人评论你的帖子时通知"
            icon="chatbubble-outline"
            value={settings.commentNotifications}
            onValueChange={(value) => handleSettingChange('commentNotifications', value)}
          />
          <NotificationSettingItem
            title="点赞通知"
            subtitle="当有人点赞你的帖子时通知"
            icon="heart-outline"
            value={settings.likeNotifications}
            onValueChange={(value) => handleSettingChange('likeNotifications', value)}
          />
        </View>

        {/* 系统通知 */}
        <SettingGroupTitle title="系统通知" />
        <View style={{ backgroundColor: COLORS.surface }}>
          <NotificationSettingItem
            title="系统通知"
            subtitle="接收系统重要消息和更新"
            icon="information-circle-outline"
            value={settings.systemNotifications}
            onValueChange={(value) => handleSettingChange('systemNotifications', value)}
          />
        </View>

        {/* 免打扰模式 */}
        <SettingGroupTitle title="免打扰模式" />
        <View style={{ backgroundColor: COLORS.surface }}>
          <NotificationSettingItem
            title="免打扰模式"
            subtitle="在指定时间段内不接收通知"
            icon="moon-outline"
            value={settings.doNotDisturb}
            onValueChange={(value) => handleSettingChange('doNotDisturb', value)}
          />
          {settings.doNotDisturb && (
            <NotificationSettingItem
              title="免打扰时间"
              subtitle={`${settings.doNotDisturbStart} - ${settings.doNotDisturbEnd}`}
              icon="time-outline"
              type="button"
              onValueChange={handleDoNotDisturbTime}
            />
          )}
        </View>

        {/* 说明文字 */}
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 20,
          backgroundColor: COLORS.background,
        }}>
          <Text style={{
            fontSize: 13,
            color: COLORS.textSecondary,
            lineHeight: 18,
            textAlign: 'center',
          }}>
            通知设置仅影响应用内通知显示，系统推送通知还需要在设备设置中开启。
          </Text>
        </View>

        {/* 底部间距 */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
};
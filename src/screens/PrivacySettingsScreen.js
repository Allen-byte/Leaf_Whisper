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

// 隐私设置项组件
const PrivacySettingItem = ({ title, subtitle, value, onValueChange, icon, type = 'switch' }) => {
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
          trackColor={{ false: COLORS.borderLight, true: COLORS.primary + '40' }}
          thumbColor={value ? COLORS.primary : COLORS.textMuted}
          ios_backgroundColor={COLORS.borderLight}
        />
      </View>
    );
  }

  // 按钮类型
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
            backgroundColor: COLORS.error + '15',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 15,
          }}>
            <Ionicons name={icon} size={20} color={COLORS.error} />
          </View>

          {/* 文本内容 */}
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '500',
              color: COLORS.error,
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

// 分组标题组件
const SectionHeader = ({ title, subtitle }) => (
  <View style={{
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  }}>
    <Text style={{
      fontSize: 18,
      fontWeight: '600',
      color: COLORS.text,
      marginBottom: subtitle ? 4 : 0,
    }}>
      {title}
    </Text>
    {subtitle && (
      <Text style={{
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
      }}>
        {subtitle}
      </Text>
    )}
  </View>
);

export const PrivacySettingsScreen = ({ navigation }) => {
  const { showSuccess, showError, showConfirm } = useToastContext();
  const { user } = useUser();

  // 隐私设置状态
  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: true,        // 个人资料可见性
    postsVisible: true,          // 帖子可见性
    commentsVisible: true,       // 评论可见性
    allowDirectMessage: true,    // 允许私信
    showOnlineStatus: true,      // 显示在线状态
    allowTagging: true,          // 允许被标记
    showEmail: false,            // 显示邮箱
    allowSearchByEmail: false,   // 允许通过邮箱搜索
    dataCollection: true,        // 数据收集
    analyticsTracking: true,     // 分析跟踪
  });

  useEffect(() => {
    // 这里可以从服务器加载用户的隐私设置
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      // TODO: 从服务器加载隐私设置
      // const settings = await getPrivacySettings(user.id);
      // setPrivacySettings(settings);
    } catch (error) {
      console.error('加载隐私设置失败:', error);
    }
  };

  const updatePrivacySetting = async (key, value) => {
    try {
      setPrivacySettings(prev => ({ ...prev, [key]: value }));
      
      // TODO: 保存到服务器
      // await updatePrivacySettings(user.id, { [key]: value });
      
      showSuccess('设置已更新');
    } catch (error) {
      console.error('更新隐私设置失败:', error);
      showError('更新失败，请重试');
      // 回滚状态
      setPrivacySettings(prev => ({ ...prev, [key]: !value }));
    }
  };

  const handleBlockedUsers = () => {
    // TODO: 导航到屏蔽用户列表页面
    showError('屏蔽用户功能正在开发中');
  };

  const handleDataExport = () => {
    showConfirm({
      title: '导出数据',
      message: '确定要导出您的所有数据吗？这可能需要一些时间。',
      confirmText: '导出',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          // TODO: 实现数据导出功能
          showSuccess('数据导出请求已提交，完成后将通过邮件发送给您');
        } catch (error) {
          showError('导出失败，请重试');
        }
      }
    });
  };

  const handleDeleteAccount = () => {
    showConfirm({
      title: '删除账户',
      message: '警告：此操作将永久删除您的账户和所有数据，且无法恢复。确定要继续吗？',
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: () => {
        // 二次确认
        showConfirm({
          title: '最终确认',
          message: '请再次确认：您真的要永久删除账户吗？',
          confirmText: '确认删除',
          cancelText: '取消',
          type: 'danger',
          onConfirm: async () => {
            try {
              // TODO: 实现账户删除功能
              showError('账户删除功能正在开发中');
            } catch (error) {
              showError('删除失败，请重试');
            }
          }
        });
      }
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* 头部 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        paddingTop: 60
      }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            marginRight: 16,
            padding: 4,
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={{
          fontSize: 20,
          fontWeight: '600',
          color: COLORS.text,
        }}>
          隐私设置
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 个人资料隐私 */}
        <SectionHeader
          title="个人资料隐私"
          subtitle="控制其他用户如何查看和访问您的个人信息"
        />
        <View style={{ backgroundColor: COLORS.surface }}>
          <PrivacySettingItem
            title="个人资料可见性"
            subtitle="允许其他用户查看您的个人资料"
            icon="person-outline"
            value={privacySettings.profileVisible}
            onValueChange={(value) => updatePrivacySetting('profileVisible', value)}
          />
          <PrivacySettingItem
            title="帖子可见性"
            subtitle="允许其他用户查看您的帖子"
            icon="document-text-outline"
            value={privacySettings.postsVisible}
            onValueChange={(value) => updatePrivacySetting('postsVisible', value)}
          />
          <PrivacySettingItem
            title="评论可见性"
            subtitle="允许其他用户查看您的评论"
            icon="chatbubble-outline"
            value={privacySettings.commentsVisible}
            onValueChange={(value) => updatePrivacySetting('commentsVisible', value)}
          />
          <PrivacySettingItem
            title="显示邮箱"
            subtitle="在个人资料中显示邮箱地址"
            icon="mail-outline"
            value={privacySettings.showEmail}
            onValueChange={(value) => updatePrivacySetting('showEmail', value)}
          />
        </View>

        {/* 交互隐私 */}
        <SectionHeader
          title="交互隐私"
          subtitle="管理其他用户与您的交互方式"
        />
        <View style={{ backgroundColor: COLORS.surface }}>
          <PrivacySettingItem
            title="允许私信"
            subtitle="其他用户可以向您发送私信"
            icon="paper-plane-outline"
            value={privacySettings.allowDirectMessage}
            onValueChange={(value) => updatePrivacySetting('allowDirectMessage', value)}
          />
          <PrivacySettingItem
            title="显示在线状态"
            subtitle="让其他用户看到您的在线状态"
            icon="radio-outline"
            value={privacySettings.showOnlineStatus}
            onValueChange={(value) => updatePrivacySetting('showOnlineStatus', value)}
          />
          <PrivacySettingItem
            title="允许被标记"
            subtitle="其他用户可以在帖子中标记您"
            icon="at-outline"
            value={privacySettings.allowTagging}
            onValueChange={(value) => updatePrivacySetting('allowTagging', value)}
          />
          <PrivacySettingItem
            title="通过邮箱搜索"
            subtitle="允许其他用户通过邮箱找到您"
            icon="search-outline"
            value={privacySettings.allowSearchByEmail}
            onValueChange={(value) => updatePrivacySetting('allowSearchByEmail', value)}
          />
        </View>

        {/* 数据隐私 */}
        <SectionHeader
          title="数据隐私"
          subtitle="控制我们如何收集和使用您的数据"
        />
        <View style={{ backgroundColor: COLORS.surface }}>
          <PrivacySettingItem
            title="数据收集"
            subtitle="允许收集使用数据以改善服务"
            icon="analytics-outline"
            value={privacySettings.dataCollection}
            onValueChange={(value) => updatePrivacySetting('dataCollection', value)}
          />
          <PrivacySettingItem
            title="分析跟踪"
            subtitle="允许分析您的使用行为"
            icon="trending-up-outline"
            value={privacySettings.analyticsTracking}
            onValueChange={(value) => updatePrivacySetting('analyticsTracking', value)}
          />
        </View>

        {/* 安全管理 */}
        <SectionHeader
          title="安全管理"
          subtitle="管理屏蔽用户和账户安全"
        />
        <View style={{ backgroundColor: COLORS.surface }}>
          <PrivacySettingItem
            title="屏蔽用户管理"
            subtitle="查看和管理已屏蔽的用户"
            icon="ban-outline"
            type="button"
            onValueChange={handleBlockedUsers}
          />
        </View>

        {/* 数据管理 */}
        <SectionHeader
          title="数据管理"
          subtitle="管理您的个人数据"
        />
        <View style={{ backgroundColor: COLORS.surface }}>
          <PrivacySettingItem
            title="导出数据"
            subtitle="下载您的所有数据副本"
            icon="download-outline"
            type="button"
            onValueChange={handleDataExport}
          />
          <PrivacySettingItem
            title="删除账户"
            subtitle="永久删除您的账户和所有数据"
            icon="trash-outline"
            type="button"
            onValueChange={handleDeleteAccount}
          />
        </View>

        {/* 底部间距 */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};
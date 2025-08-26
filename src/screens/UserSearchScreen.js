import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons, Entypo } from '@expo/vector-icons';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { COLORS } from '../theme/colors';
import { searchUsers } from '../services/onlineOnlyStorage';

const UserItem = ({ user, onPress }) => (
  <Pressable
    style={({ pressed }) => ({
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: pressed ? COLORS.borderLight : COLORS.surface,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.borderLight,
    })}
    onPress={() => onPress(user)}
  >
    <Avatar
      uri={user.avatar}
      name={user.name}
      size={48}
      style={{ marginRight: 12 }}
    />
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: COLORS.text,
        }}>
          {user.name}
        </Text>
        {user.sex && (
          <View style={{
            backgroundColor: user.sex === 'male' ? '#e3f2fd' : '#fce4ec',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 8,
          }}>
            <Ionicons
              name={user.sex === 'male' ? 'male' : 'female'}
              size={12}
              color={user.sex === 'male' ? '#2196f3' : '#e91e63'}
            />
          </View>
        )}
      </View>
      <Text style={{
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
      }}>
        @{user.email || '无邮箱'}
      </Text>
      {user.bio && (
        <Text style={{
          fontSize: 13,
          color: COLORS.textMuted,
          marginTop: 4,
          numberOfLines: 1,
        }}>
          {user.bio}
        </Text>
      )}
    </View>
    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
  </Pressable>
);

export const UserSearchScreen = ({ navigation, route }) => {
  const [searchText, setSearchText] = useState(route.params?.query || '');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (route.params?.query) {
      handleSearch(route.params.query);
    }
  }, [route.params?.query]);

  const handleSearch = async (query = searchText) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const response = await searchUsers(query.trim());
      if (response.success) {
        setUsers(response.data || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (user) => {
    navigation.navigate('UserProfile', { userId: user.id });
  };

  const renderEmptyState = () => {
    if (!searched) {
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 60,
        }}>
          <Text style={{ marginBottom: 16, fontSize: 40 }}>
            🙈🙈🙈
          </Text>
          
        </View>
      );
    }

    if (users.length === 0) {
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 60,
        }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>
            💢
          </Text>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: COLORS.text,
            marginBottom: 8,
          }}>
            没有找到用户
          </Text>
          <Text style={{
            color: COLORS.textMuted,
            fontSize: 14,
            textAlign: 'center',
          }}>
            试试其他关键词吧
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }}>
      {/* 搜索栏 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        paddingTop: 50,
      }}>
        <Button
          title="←"
          variant="ghost"
          size="small"
          onPress={() => navigation.goBack()}
          style={{ marginRight: 12 }}
        />
        
        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: COLORS.borderLight,
          borderRadius: 20,
          paddingHorizontal: 16,
          height: 40,
        }}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={{
              flex: 1,
              fontSize: 14,
              color: COLORS.text,
              paddingVertical: 0,
            }}
            placeholder="输入用户昵称"
            placeholderTextColor={COLORS.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoFocus
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* 搜索结果 */}
      {loading ? (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{
            color: COLORS.textMuted,
            fontSize: 16,
            marginTop: 12,
          }}>
            正在搜索...
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <UserItem user={item} onPress={handleUserPress} />
          )}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};
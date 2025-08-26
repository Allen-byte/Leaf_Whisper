import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

export const CustomTabBar = ({ navigation, currentScreen, onScreenChange }) => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchWidth = new Animated.Value(40);
  const tabBarScale = useRef(new Animated.Value(1)).current;
  const tabBarOpacity = useRef(new Animated.Value(1)).current;
  const slideUpAnim = useRef(new Animated.Value(0)).current;
  const buttonScales = useRef({
    Home: new Animated.Value(1),
    Create: new Animated.Value(1),
    Profile: new Animated.Value(1),
  }).current;

  // 初始动画
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideUpAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(tabBarOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 按钮点击动画
  const animateButton = (screenName) => {
    Animated.sequence([
      Animated.timing(buttonScales[screenName], {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScales[screenName], {
        toValue: 1,
        tension: 300,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 页面切换时的动画
  const handleScreenChange = (screenName) => {
    animateButton(screenName);

    // 添加轻微的缩放效果
    Animated.sequence([
      Animated.timing(tabBarScale, {
        toValue: 0.90,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(tabBarScale, {
        toValue: 1,
        tension: 300,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    onScreenChange(screenName);
  };

  const expandSearch = () => {
    setSearchExpanded(true);
    Animated.timing(searchWidth, {
      toValue: width * 0.6,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const collapseSearch = () => {
    if (searchText.trim()) {
      navigation.navigate('UserSearch', { query: searchText.trim() });
    }

    setSearchExpanded(false);
    setSearchText('');
    Animated.timing(searchWidth, {
      toValue: 40,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      navigation.navigate('UserSearch', { query: searchText.trim() });
      collapseSearch();
    }
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        transform: [
          { scale: tabBarScale },
          {
            translateY: slideUpAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            }),
          },
        ],
        opacity: tabBarOpacity,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* 左侧导航按钮 */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 15,
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: 40,
          paddingHorizontal: 10,
          paddingVertical: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 12,
        }}>
          {/* 社区按钮 */}
          <Animated.View style={{ transform: [{ scale: buttonScales.Home }] }}>
            <Pressable
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 26,
                backgroundColor: currentScreen === 'Home'
                  ? '#6353ac'
                  : pressed
                    ? COLORS.borderLight
                    : 'transparent',
              })}
              onPress={() => handleScreenChange('Home')}
            >
              <View style={{ alignItems: 'center' }}>
                <Ionicons
                  name={currentScreen === 'Home' ? "home" : "home-outline"}
                  size={24}
                  color={currentScreen === 'Home' ? '#fff' : '#eee'}
                />
              </View>
            </Pressable>
          </Animated.View>

          {/* 创作按钮 */}
          <Animated.View style={{ transform: [{ scale: buttonScales.Create }] }}>
            <Pressable
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 26,
                backgroundColor: currentScreen === 'Create'
                  ? '#6353ac'
                  : pressed
                    ? COLORS.borderLight
                    : 'transparent',
              })}
              onPress={() => handleScreenChange('Create')}
            >
              <View style={{ alignItems: 'center' }}>
                <Ionicons
                  name={currentScreen === 'Create' ? "add-circle" : "add-circle-outline"}
                  size={28}
                  color={currentScreen === 'Create' ? '#fff' : '#eee'}
                />
              </View>
            </Pressable>
          </Animated.View>

          {/* 我的按钮 */}
          <Animated.View style={{ transform: [{ scale: buttonScales.Profile }] }}>
            <Pressable
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 26,
                backgroundColor: currentScreen === 'Profile'
                  ? '#6353ac'
                  : pressed
                    ? COLORS.borderLight
                    : 'transparent',
              })}
              onPress={() => handleScreenChange('Profile')}
            >
              <View style={{ alignItems: 'center' }}>
                <Ionicons
                  name={currentScreen === 'Profile' ? "person" : "person-outline"}
                  size={24}
                  color={currentScreen === 'Profile' ? '#fff' : '#eee'}
                />
              </View>
            </Pressable>
          </Animated.View>
        </View>

        {/* 右侧搜索框 */}
        <View style={{
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: 40,
          paddingHorizontal: 12,
          paddingVertical: 12,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 6,
          height: 44,
          width: 44,
          alignItems: 'center'
        }}>
          <Pressable
            onPress={() => navigation.navigate('UserSearch')}
          >
            <Ionicons name="search" size={20} color='#fff' />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};
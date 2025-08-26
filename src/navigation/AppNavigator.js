import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateScreen } from '../screens/CreateScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { MyPostsScreen } from '../screens/MyPostsScreen';
import { MyCommentsScreen } from '../screens/MyCommentsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { UserSearchScreen } from '../screens/UserSearchScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { PrivacySettingsScreen } from '../screens/PrivacySettingsScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import MessageCenterScreen from '../screens/MessageCenterScreen';
import { COLORS } from '../theme/colors';
import { useUser } from '../contexts/UserContext';
import { InsightsScreen } from '../screens/InsightsScreen';
import EditPostScreen from '../screens/EditPostScreen';
import PostReviewScreen from '../screens/PostReviewScreen';
import { CustomTabBar } from '../components/CustomTabBar';
import PostDetailScreen from '../screens/PostDetailScreen';
import { MyFollowingScreen } from '../screens/MyFollowingScreen';
import { MyFollowersScreen } from '../screens/MyFollowersScreen';
import { MyMarksScreen } from '../screens/MyMarksScreen';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 自定义主题
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bg,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    primary: COLORS.primary,
  },
};

// 主内容导航器
const MainNavigator = createNativeStackNavigator();


// 带自定义导航栏的主屏幕组件
const MainScreenWithCustomTabBar = ({ navigation }) => {
  const [currentScreen, setCurrentScreen] = React.useState('Home');
  
  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen navigation={navigation} route={{}} />;
      case 'Create':
        return <CreateScreen navigation={navigation} route={{}} />;
      case 'Profile':
        return <ProfileScreen navigation={navigation} route={{}} />;
      default:
        return <HomeScreen navigation={navigation} route={{}} />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 屏幕内容 */}
      {renderScreen()}
      
      {/* 底部悬浮导航栏 */}
      <CustomTabBar 
        navigation={navigation} 
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
      />
    </View>
  );
};

// 加载屏幕组件
const LoadingScreen = () => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: COLORS.bg 
  }}>
    <Text style={{ fontSize: 48, marginBottom: 20 }}>🌱</Text>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={{ 
      marginTop: 16, 
      color: COLORS.textMuted, 
      fontSize: 16 
    }}>
      正在加载...
    </Text>
  </View>
);

// 主导航器
export const AppNavigator = () => {
  const { isLoggedIn, isLoading } = useUser();

  if (isLoading) {
    return (
      <NavigationContainer theme={AppTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Loading" component={LoadingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator initialRouteName={isLoggedIn ? "Tabs" : "Login"}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
        name="Create"
        component={CreateScreen}
        options={{ headerShown: false }}
        />
        <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Tabs"
          component={MainScreenWithCustomTabBar}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MessageCenter"
          component={MessageCenterScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="MyPosts"
          component={MyPostsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyComments"
          component={MyCommentsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditPost"
          component={EditPostScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Insights"
          component={InsightsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UserSearch"
          component={UserSearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UserProfile"
          component={UserProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PostReview"
          component={PostReviewScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PrivacySettings"
          component={PrivacySettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PostDetail"
          component={PostDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyFollowing"
          component={MyFollowingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyFollowers"
          component={MyFollowersScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyMarks"
          component={MyMarksScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
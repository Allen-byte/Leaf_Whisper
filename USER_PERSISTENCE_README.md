# 用户信息持久化存储功能

## 概述

现在应用已经实现了完整的用户信息持久化存储功能，用户登录成功后，其信息（包括头像、姓名、简介等）会被保存到本地存储中，并提供全局访问。用户退出登录后，本地存储的信息会被清除。

## 主要功能

### 1. 用户信息持久化
- ✅ 登录成功后自动保存用户信息到本地
- ✅ 包含完整的用户数据：ID、用户名、姓名、简介、头像、创建时间等
- ✅ 退出登录时自动清除本地存储的用户信息

### 2. 全局用户状态管理
- ✅ 使用React Context提供全局用户状态
- ✅ 自动初始化用户状态（应用启动时检查本地存储）
- ✅ 实时同步用户信息更新

### 3. 便捷的访问方式
- ✅ `useUser()` Hook - 完整的用户状态管理
- ✅ `useCurrentUser()` Hook - 便捷的用户信息访问方法
- ✅ `CurrentUserAvatar` 组件 - 自动显示当前用户头像

## 核心文件

### 服务层
- `frontend/src/services/userService.js` - 用户信息管理服务
- `frontend/src/services/api.js` - API服务（已更新token管理）

### 状态管理
- `frontend/src/contexts/UserContext.js` - 用户状态Context
- `frontend/src/hooks/useCurrentUser.js` - 便捷的用户信息访问Hook

### 组件
- `frontend/src/components/ui/CurrentUserAvatar.js` - 当前用户头像组件

### 更新的页面
- `frontend/src/screens/LoginScreen.js` - 使用UserContext进行登录
- `frontend/src/screens/RegisterScreen.js` - 使用UserContext进行注册
- `frontend/src/screens/ProfileScreen.js` - 使用UserContext显示用户信息
- `frontend/src/screens/EditProfileScreen.js` - 使用UserContext更新用户信息
- `frontend/src/navigation/AppNavigator.js` - 使用UserContext管理导航状态

## 使用方法

### 1. 获取当前用户信息

```javascript
import { useUser } from '../contexts/UserContext';

const MyComponent = () => {
  const { user, isLoggedIn, isLoading } = useUser();
  
  if (isLoading) return <Text>加载中...</Text>;
  if (!isLoggedIn) return <Text>请先登录</Text>;
  
  return (
    <View>
      <Text>欢迎，{user.name}！</Text>
      <Text>简介：{user.bio}</Text>
    </View>
  );
};
```

### 2. 使用便捷Hook

```javascript
import { useCurrentUser } from '../hooks/useCurrentUser';

const MyComponent = () => {
  const { 
    getDisplayName, 
    getAvatar, 
    getBio, 
    isCurrentUser,
    updateUser 
  } = useCurrentUser();
  
  return (
    <View>
      <Text>{getDisplayName()}</Text>
      <Text>{getBio()}</Text>
    </View>
  );
};
```

### 3. 显示当前用户头像

```javascript
import { CurrentUserAvatar } from '../components/ui/CurrentUserAvatar';

const MyComponent = () => {
  return (
    <View>
      <CurrentUserAvatar size={60} />
    </View>
  );
};
```

### 4. 用户操作

```javascript
import { useUser } from '../contexts/UserContext';

const MyComponent = () => {
  const { login, logout, updateUser, refreshUser } = useUser();
  
  const handleLogin = async () => {
    try {
      await login(username, password);
      // 登录成功，用户信息已自动保存
    } catch (error) {
      console.error('登录失败:', error);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      // 退出成功，本地用户信息已清除
    } catch (error) {
      console.error('退出失败:', error);
    }
  };
  
  const handleUpdateProfile = async () => {
    try {
      await updateUser({ name: '新名称', bio: '新简介' });
      // 用户信息已更新并同步到本地存储
    } catch (error) {
      console.error('更新失败:', error);
    }
  };
};
```

## 数据流程

### 登录流程
1. 用户输入用户名和密码
2. 调用 `UserService.login()` 
3. 发送登录请求到服务器
4. 服务器返回token和用户基本信息
5. 保存token到AsyncStorage
6. 获取完整用户信息（包括头像等）
7. 保存完整用户信息到AsyncStorage
8. 更新全局用户状态

### 退出登录流程
1. 调用 `UserService.logout()`
2. 清除服务器端session（如果需要）
3. 删除本地存储的token
4. 删除本地存储的用户信息
5. 清除全局用户状态

### 应用启动流程
1. UserProvider初始化
2. 检查本地是否有token
3. 检查本地是否有用户信息
4. 如果都存在，设置为已登录状态
5. 如果缺失任一项，设置为未登录状态

## 存储键值

- `authToken` - JWT认证令牌
- `currentUser` - 当前用户完整信息

## 安全考虑

1. **Token管理**: JWT token存储在AsyncStorage中，应用重启后自动检查有效性
2. **数据同步**: 用户信息更新时同时更新本地存储和全局状态
3. **错误处理**: 网络错误或token过期时自动清除本地状态
4. **数据验证**: 登录时验证token有效性，无效时自动清除

## 测试

可以使用 `frontend/src/utils/testUserPersistence.js` 中的测试函数来验证持久化存储功能：

```javascript
import { testUserPersistence } from '../utils/testUserPersistence';

// 在开发环境下运行测试
testUserPersistence();
```

## 后续优化建议

1. **数据加密**: 考虑对敏感用户信息进行加密存储
2. **缓存策略**: 实现更智能的缓存更新策略
3. **离线支持**: 增强离线状态下的用户体验
4. **数据同步**: 实现多设备间的用户数据同步
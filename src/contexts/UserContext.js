import React, { createContext, useContext, useReducer, useEffect } from 'react';
import UserService from '../services/userService';

// 用户状态的初始值
const initialState = {
  user: null,
  isLoading: true,
  isLoggedIn: false,
};

// Action types
const USER_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  CLEAR_USER: 'CLEAR_USER',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const userReducer = (state, action) => {
  switch (action.type) {
    case USER_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case USER_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isLoggedIn: !!action.payload,
        isLoading: false,
      };
    case USER_ACTIONS.CLEAR_USER:
      return {
        ...state,
        user: null,
        isLoggedIn: false,
        isLoading: false,
      };
    case USER_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

// 创建Context
const UserContext = createContext();

// Provider组件
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // 初始化用户状态
  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true });
      
      const isLoggedIn = await UserService.isLoggedIn();
      if (isLoggedIn) {
        const user = await UserService.getCurrentUser();
        dispatch({ type: USER_ACTIONS.SET_USER, payload: user });
      } else {
        dispatch({ type: USER_ACTIONS.CLEAR_USER });
      }
    } catch (error) {
      console.error('初始化用户状态失败:', error);
      dispatch({ type: USER_ACTIONS.CLEAR_USER });
    }
  };

  // 登录
  const login = async (username, password) => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true });
      
      const response = await UserService.login(username, password);
      if (response.success) {
        const user = await UserService.getCurrentUser();
        dispatch({ type: USER_ACTIONS.SET_USER, payload: user });
      }
      
      return response;
    } catch (error) {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false });
      throw error;
    }
  };

  // 注册
  const register = async (userData) => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true });
      
      const response = await UserService.register(userData);
      if (response.success) {
        const user = await UserService.getCurrentUser();
        dispatch({ type: USER_ACTIONS.SET_USER, payload: user });
      }
      
      return response;
    } catch (error) {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false });
      throw error;
    }
  };

  // 退出登录
  const logout = async () => {
    try {
      await UserService.logout();
      dispatch({ type: USER_ACTIONS.CLEAR_USER });
    } catch (error) {
      console.error('退出登录失败:', error);
      // 即使服务器请求失败，也要清除本地状态
      dispatch({ type: USER_ACTIONS.CLEAR_USER });
    }
  };

  // 更新用户信息
  const updateUser = async (userData) => {
    try {
      const updatedUser = await UserService.updateUserInfo(userData);
      dispatch({ type: USER_ACTIONS.UPDATE_USER, payload: updatedUser });
      return updatedUser;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  };

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      const user = await UserService.refreshUserInfo();
      dispatch({ type: USER_ACTIONS.SET_USER, payload: user });
      return user;
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      throw error;
    }
  };

  const value = {
    // 状态
    user: state.user,
    isLoading: state.isLoading,
    isLoggedIn: state.isLoggedIn,
    
    // 方法
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    initializeUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Hook for using the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
import 'react-native-gesture-handler';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initStorage } from './src/services/storage'; // 改为使用storage.js
import { ToastProvider } from './src/contexts/ToastContext';
import { UserProvider } from './src/contexts/UserContext';


export default function App() {
  return (
    <UserProvider>
      <ToastProvider>
        <AppNavigator />
      </ToastProvider>
    </UserProvider>
  );
}

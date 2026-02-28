import './global.css';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import { syncStorage } from './src/services/syncStorage';
import { runMigrations } from './src/services/storage';
import { initializeDefaultData } from './src/services/initialData';
import { settleOverdueTransactions } from './src/utils/billingUtils';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await syncStorage.initialize();
      runMigrations();
      initializeDefaultData();
      settleOverdueTransactions();
      setIsReady(true);
    };
    void init();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#374151" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
          <Toast />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

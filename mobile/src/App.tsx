/**
 * MLG.clan Mobile Application
 * Gaming platform with blockchain integration and comprehensive authentication
 */

import React, {useEffect} from 'react';
import {StatusBar, Alert} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import BootSplash from 'react-native-bootsplash';

// Store
import {store, persistor} from '@/store';

// Navigation
import {AppNavigator} from '@/navigation/AppNavigator';

// Services
import {NotificationService} from '@/services/NotificationService';
import {WalletService} from '@/services/WalletService';
import {SyncService} from '@/services/SyncService';
import {PerformanceMonitor} from '@/services/PerformanceMonitor';

// Components
import {LoadingScreen} from '@/components/common/LoadingScreen';
import {ErrorBoundary} from '@/components/common/ErrorBoundary';

// Styles
import {ThemeProvider} from '@/components/theme/ThemeProvider';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize core services
    const initializeApp = async () => {
      try {
        // Start performance monitoring
        PerformanceMonitor.startMonitoring();
        
        // Initialize notifications
        await NotificationService.initialize();
        
        // Initialize wallet service
        await WalletService.initialize();
        
        // Initialize sync service
        SyncService.initialize();
        
        // Hide splash screen
        await BootSplash.hide({fade: true});
        
        console.log('MLG.clan Mobile App initialized successfully');
      } catch (error) {
        console.error('App initialization error:', error);
        Alert.alert(
          'Initialization Error',
          'There was a problem starting the app. Please restart the application.',
          [{text: 'OK'}]
        );
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      PerformanceMonitor.stopMonitoring();
      SyncService.cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{flex: 1}}>
        <SafeAreaProvider>
          <Provider store={store}>
            <PersistGate 
              loading={<LoadingScreen />} 
              persistor={persistor}
            >
              <ThemeProvider>
                <StatusBar
                  barStyle="light-content"
                  backgroundColor="#1a1a1a"
                  translucent
                />
                <AppNavigator />
              </ThemeProvider>
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default App;
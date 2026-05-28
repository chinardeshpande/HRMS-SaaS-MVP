import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { StyleSheet, View, Text } from 'react-native';
import { useAuthStore } from './src/context/useAuthStore';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { AppNavigator } from './src/navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from './src/utils/notifications';
import { ErrorBoundary } from './src/components/ErrorBoundary';

import { paperTheme } from './src/utils/theme';

export default function App() {
  const { isAuthenticated, isLoading, initAuth } = useAuthStore();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Initialize auth from stored tokens on startup
    initAuth();

    // Register push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log('📬 Registered Push Notification Token:', token);
      }
    });

    // Triggered when a notification is received while the app is in the foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Foreground Notification Received:', notification);
    });

    // Triggered when a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification Click Action:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#0A66C2" />
        <Text style={styles.splashText}>AuroraHR</Text>
        <Text style={styles.splashSubText}>Illuminating The Workplace...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <StatusBar style="dark" />
        <ErrorBoundary>
          <NavigationContainer>
            {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
          </NavigationContainer>
        </ErrorBoundary>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginTop: 18,
    letterSpacing: -0.5,
  },
  splashSubText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },
});

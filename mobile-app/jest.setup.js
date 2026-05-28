import '@testing-library/react-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  return require('@react-native-async-storage/async-storage/jest/async-storage-mock');
});

// Mock expo-secure-store
jest.mock('expo-secure-store', () => {
  const store = {};
  return {
    setItemAsync: jest.fn(async (key, value) => {
      store[key] = String(value);
      return null;
    }),
    getItemAsync: jest.fn(async (key) => {
      return store[key] || null;
    }),
    deleteItemAsync: jest.fn(async (key) => {
      delete store[key];
      return null;
    }),
  };
});

// Mock expo-local-authentication (biometrics)
jest.mock('expo-local-authentication', () => {
  return {
    hasHardwareAsync: jest.fn(async () => true),
    isEnrolledAsync: jest.fn(async () => true),
    authenticateAsync: jest.fn(async () => ({ success: true })),
    AuthenticationType: {
      FINGERPRINT: 1,
      FACIAL_RECOGNITION: 2,
      IRIS: 3,
    },
    SecurityLevel: {
      NONE: 0,
      SECRET: 1,
      BIOMETRIC: 2,
    },
  };
});

// Mock expo-location
jest.mock('expo-location', () => {
  return {
    requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    getCurrentPositionAsync: jest.fn(async () => ({
      coords: {
        latitude: 12.9716,
        longitude: 77.5946,
        altitude: 0,
        accuracy: 5,
        altitudeAccuracy: 5,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    })),
    Accuracy: {
      Balanced: 3,
      High: 4,
    },
  };
});

// Mock expo-notifications
jest.mock('expo-notifications', () => {
  return {
    getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[mock]' })),
    requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    removeNotificationSubscription: jest.fn(),
    setNotificationHandler: jest.fn(),
    scheduleNotificationAsync: jest.fn(async () => 'mock-notification-id'),
  };
});

// Mock expo-sharing
jest.mock('expo-sharing', () => {
  return {
    isAvailableAsync: jest.fn(async () => true),
    shareAsync: jest.fn(async () => ({ success: true })),
  };
});

// Mock expo-web-browser
jest.mock('expo-web-browser', () => {
  return {
    openBrowserAsync: jest.fn(async () => ({ type: 'opened' })),
  };
});

// Mock react-native-reanimated or any visual transition tools if required
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

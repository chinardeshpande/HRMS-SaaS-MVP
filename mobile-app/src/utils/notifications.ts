import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how foreground notifications are handled
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Requests push notification permissions and configures notification channels.
 * Returns the device token or a mock token if running on a simulator.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0A66C2',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permission not granted');
      return null;
    }
    
    try {
      // Use expo push token retrieval
      const expoToken = (await Notifications.getExpoPushTokenAsync()).data;
      token = expoToken;
      console.log('✅ Expo Push Token registered:', token);
    } catch (e) {
      console.warn('⚠️ Failed to fetch Expo push token, falling back to device token:', e);
      try {
        const deviceToken = (await Notifications.getDevicePushTokenAsync()).data;
        token = deviceToken;
      } catch (err) {
        console.warn('⚠️ Failed to fetch native device token:', err);
      }
    }
  } else {
    console.log('ℹ️ Push notifications need physical hardware. Using simulator mock.');
    token = 'ExponentPushToken[MOCK_SIMULATOR_TOKEN]';
  }

  return token;
}

/**
 * Fires an immediate local notification (useful for visual testing & local alarms)
 */
export async function sendLocalNotification(
  title: string, 
  body: string, 
  data?: Record<string, any>
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // null means trigger immediately
    });
  } catch (e) {
    console.warn('⚠️ Failed to schedule immediate local notification:', e);
  }
}

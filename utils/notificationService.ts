import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Linking, Platform } from 'react-native';
import axios from 'axios';

const API_URL = 'https://api.gympaddy.com/api/user/set-fcm-token';

export async function ensureNotificationPermission(promptIfNeeded = false): Promise<boolean> {
    if (!Device.isDevice) {
        console.warn('Push notifications require a physical device.');
        return false;
    }

    const current = await Notifications.getPermissionsAsync();
    let finalStatus = current.status;

    const shouldRequest =
        finalStatus !== 'granted' &&
        (finalStatus === 'undetermined' || current.canAskAgain !== false);

    if (shouldRequest) {
        const requested = await Notifications.requestPermissionsAsync({
            ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
            },
        });
        finalStatus = requested.status;
    }

    if (finalStatus !== 'granted' && promptIfNeeded) {
        Alert.alert(
            'Enable notifications',
            'Turn on notifications in your device settings to get messages, likes, and updates from GymPaddy.',
            [
                { text: 'Not now', style: 'cancel' },
                {
                    text: 'Open settings',
                    onPress: () => {
                        if (Platform.OS === 'ios') {
                            Linking.openURL('app-settings:');
                        } else {
                            Linking.openSettings();
                        }
                    },
                },
            ],
        );
    }

    return finalStatus === 'granted';
}

export async function setupPushNotifications(authToken: string): Promise<string | null> {
    const granted = await ensureNotificationPermission(false);
    if (!granted) {
        return null;
    }

    const fcmToken = await registerForPushNotificationsAsync();
    if (fcmToken) {
        await saveFcmTokenToServer(fcmToken, authToken);
    }
    return fcmToken;
}

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    try {
        const granted = await ensureNotificationPermission(false);
        if (!granted) {
            console.log('Notification permissions not granted.');
            return null;
        }

        const tokenData = await Notifications.getDevicePushTokenAsync();
        const fcmToken = tokenData.data;
        console.log('FCM Push Token Retrieved:', fcmToken);

        return fcmToken;
    } catch (error) {
        console.error('Error while registering for push notifications:', error);
        return null;
    }
};

interface ApiResponse {
    message: string;
    [key: string]: any;
}

export const saveFcmTokenToServer = async (fcmToken: string, authToken: string): Promise<void> => {
    try {
        const response = await axios.post<ApiResponse>(
            API_URL,
            { fcmToken },
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );

        console.log('FCM token saved successfully:', response.data.message);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('Failed to save FCM token:', error.response.data);
        } else if (error instanceof Error) {
            console.error('Error saving FCM token:', error.message);
        }
    }
};

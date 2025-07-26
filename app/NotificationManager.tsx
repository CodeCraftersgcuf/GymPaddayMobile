import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Alert, AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { registerForPushNotificationsAsync, saveFcmTokenToServer } from '@/utils/notificationService';
import { useRouter } from 'expo-router';

export default function NotificationManager({ token, user }: { token: string; user: any }) {
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);
    const appState = useRef(AppState.currentState);
    const router = useRouter();
    const userId = user?.id;

    // Show notification only if it belongs to the logged-in user
    useEffect(() => {
        Notifications.setNotificationHandler({
            handleNotification: async (notification) => {
                const notifUserId = notification?.request?.content?.data?.userId;
                if (parseInt(notifUserId) === userId) {
                    return {
                        shouldShowAlert: true,
                        shouldPlaySound: true,
                        shouldSetBadge: true,
                    };
                }
                return {
                    shouldShowAlert: false,
                    shouldPlaySound: false,
                    shouldSetBadge: false,
                };
            },
        });
    }, [userId]);

    useEffect(() => {
        if (!token || !userId) return;

        const setupNotifications = async () => {
            const fcmToken = await registerForPushNotificationsAsync();
            if (fcmToken) {
                await saveFcmTokenToServer(fcmToken, token);
                console.log('✅ FCM token saved for user:', userId);
            }

            // Remove old listeners
            if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
            if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);

            // Foreground notification
            notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
                const data = notification.request.content.data || {};
                const notifUserId = data.userId;
                console.log('📥 Notification received (foreground):', data);

                if (parseInt(notifUserId) == userId && data.type === 'incoming_call') {
                    console.log('📞 Incoming call detected');
                    router.push({
                        pathname: '/StreamIncomingCall',
                        params: {
                            receiver_id: data?.caller_id,
                            call_id: data.call_id,
                            call_type: data.call_type,
                            caller_name: data.caller_name || 'Unknown',
                        },
                    });
                }
            });

            // Background or tapped notification
            responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
                const data = response.notification.request.content.data || {};
                const notifUserId = data.userId;
                console.log('📥 Notification tap response received:', data);

                if (parseInt(notifUserId) === userId && data.type === 'incoming_call') {
                    console.log('📞 Tapped incoming call');
                    router.push({
                        pathname: '/StreamIncomingCall',
                        params: {
                            receiver_id: data.caller_id,
                            call_id: data.call_id,
                            call_type: data.call_type,
                            caller_name: data.caller_name || 'Unknown',
                        },
                    });
                }
            });
        };

        setupNotifications();

        return () => {
            if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
            if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, [token, userId]);

    return null;
}

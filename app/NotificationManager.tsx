import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import { registerForPushNotificationsAsync, saveFcmTokenToServer } from '@/utils/notificationService';
import { useRouter } from 'expo-router';
import { queryClient } from '@/utils/queryClient';
import { removePendingPost } from '@/utils/pendingPosts';
import { prefetchStoriesFromCache } from '@/utils/storyPrefetch';
import Toast from 'react-native-toast-message';

function isForUser(data: Record<string, unknown>, userId: number | undefined): boolean {
  if (!userId) return false;
  const notifUserId = data.userId ?? data.user_id;
  return parseInt(String(notifUserId), 10) === userId;
}

async function handleContentNotification(data: Record<string, unknown>) {
  const type = data.type as string | undefined;

  if (type === 'post_published') {
    const postId = data.post_id ? Number(data.post_id) : null;
    if (postId) await removePendingPost(postId);
    await queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    await queryClient.refetchQueries({ queryKey: ['userPosts'] });
    Toast.show({
      type: 'success',
      text1: 'Post is live',
      text2: 'Your post has been published to the feed.',
      visibilityTime: 2500,
    });
    return;
  }

  if (type === 'post_failed') {
    const postId = data.post_id ? Number(data.post_id) : null;
    if (postId) await removePendingPost(postId);
    Toast.show({
      type: 'error',
      text1: 'Post failed',
      text2: 'We could not process your post. Please try again.',
      visibilityTime: 4000,
    });
    return;
  }

  if (type === 'story_published') {
    await queryClient.invalidateQueries({ queryKey: ['groupedStories'] });
    await queryClient.refetchQueries({ queryKey: ['groupedStories'] });
    prefetchStoriesFromCache();
    Toast.show({
      type: 'success',
      text1: 'Story is live',
      text2: 'Your story is now visible.',
      visibilityTime: 2000,
    });
    return;
  }

  if (type === 'story_failed') {
    Toast.show({
      type: 'error',
      text1: 'Story failed',
      text2: 'We could not process your story. Please try again.',
      visibilityTime: 4000,
    });
  }
}

export default function NotificationManager({ token, user }: { token: string; user: any }) {
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);
    const appState = useRef(AppState.currentState);
    const router = useRouter();
    const userId = user?.id;

    useEffect(() => {
        Notifications.setNotificationHandler({
            handleNotification: async (notification) => {
                const data = notification?.request?.content?.data || {};
                const notifUserId = data.userId ?? data.user_id;
                if (parseInt(String(notifUserId), 10) === userId) {
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

            notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
                const data = (notification.request.content.data || {}) as Record<string, unknown>;
                console.log('📥 Notification received (foreground):', data);

                if (!isForUser(data, userId)) return;

                if (data.type === 'incoming_call') {
                    router.push({
                        pathname: '/StreamIncomingCall',
                        params: {
                            receiver_id: String(data?.caller_id ?? ''),
                            call_id: String(data.call_id ?? ''),
                            call_type: String(data.call_type ?? ''),
                            caller_name: String(data.caller_name || 'Unknown'),
                        },
                    });
                    return;
                }

                handleContentNotification(data).catch(() => {});
            });

            responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
                const data = (response.notification.request.content.data || {}) as Record<string, unknown>;
                console.log('📥 Notification tap response received:', data);

                if (!isForUser(data, userId)) return;

                if (data.type === 'incoming_call') {
                    router.push({
                        pathname: '/StreamIncomingCall',
                        params: {
                            receiver_id: String(data.caller_id ?? ''),
                            call_id: String(data.call_id ?? ''),
                            call_type: String(data.call_type ?? ''),
                            caller_name: String(data.caller_name || 'Unknown'),
                        },
                    });
                    return;
                }

                handleContentNotification(data).catch(() => {});
            });
        };

        setupNotifications();

        return () => {
            /* listeners cleaned up on remount */
        };
    }, [token, userId, router]);

    return null;
}

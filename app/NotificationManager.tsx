import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, InteractionManager } from 'react-native';
import { registerForPushNotificationsAsync, saveFcmTokenToServer } from '@/utils/notificationService';
import { navigateFromNotification } from '@/utils/notificationNavigation';
import { useRouter } from 'expo-router';
import { mergeRecentlyPublishedIntoFeedCache } from '@/utils/queries/posts';
import { queryClient } from '@/utils/queryClient';
import { removePendingPostByPostId } from '@/utils/pendingPosts';
import { prefetchStoriesFromCache } from '@/utils/storyPrefetch';
import Toast from 'react-native-toast-message';
import * as SecureStore from 'expo-secure-store';

function isForUser(data: Record<string, unknown>, userId: number | undefined): boolean {
  if (!userId) return false;
  const notifUserId = data.userId ?? data.user_id;
  return parseInt(String(notifUserId), 10) === userId;
}

async function handleContentNotification(
  data: Record<string, unknown>,
  userId?: number,
) {
  const type = data.type as string | undefined;

  if (type === 'post_published') {
    const postId = data.post_id ? Number(data.post_id) : null;
    if (postId) await removePendingPostByPostId(postId);
    await queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    await queryClient.refetchQueries({ queryKey: ['userPosts'] });
    mergeRecentlyPublishedIntoFeedCache(queryClient);
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
    if (postId) await removePendingPostByPostId(postId);
    Toast.show({
      type: 'error',
      text1: 'Post failed',
      text2: 'We could not process your post. Please try again.',
      visibilityTime: 4000,
    });
    return;
  }

  if (type === 'story_published') {
    const storyId = data.story_id ? Number(data.story_id) : null;
    if (storyId && userId) {
      const { clearPendingMyStory } = await import('@/utils/pendingMyStories');
      clearPendingMyStory(userId, storyId);
    }
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
    if (userId) {
      const { clearPendingMyStoriesForUser } = await import('@/utils/pendingMyStories');
      clearPendingMyStoriesForUser(userId);
    }
    Toast.show({
      type: 'error',
      text1: 'Story failed',
      text2: 'We could not process your story. Please try again.',
      visibilityTime: 4000,
    });
  }
}

async function readSession(): Promise<{ token: string; userId: number } | null> {
  const token = await SecureStore.getItemAsync('auth_token');
  const userData = await SecureStore.getItemAsync('user_data');
  if (!token || !userData) return null;

  try {
    const user = JSON.parse(userData);
    const userId = Number(user?.id);
    if (!userId) return null;
    return { token, userId };
  } catch {
    return null;
  }
}

export default function NotificationManager() {
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);
    const listenersBoundForUser = useRef<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        Notifications.setNotificationHandler({
            handleNotification: async (notification) => {
                const data = notification?.request?.content?.data || {};
                const session = await readSession();
                const notifUserId = data.userId ?? data.user_id;
                if (session && parseInt(String(notifUserId), 10) === session.userId) {
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
    }, []);

    useEffect(() => {
        const bindListeners = (userId: number) => {
            if (listenersBoundForUser.current === userId) return;
            listenersBoundForUser.current = userId;

            notificationListener.current?.remove();
            responseListener.current?.remove();

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

                handleContentNotification(data, userId).catch(() => {});
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

                const navigated = navigateFromNotification(router, {
                    id: String(data.notification_id ?? ''),
                    title: String(response.notification.request.content.title ?? ''),
                    type: String(data.type ?? ''),
                    data,
                });
                if (!navigated) {
                    handleContentNotification(data, userId).catch(() => {});
                }
            });
        };

        const setupNotifications = async () => {
            const session = await readSession();
            if (!session) return;

            await new Promise<void>((resolve) => {
                InteractionManager.runAfterInteractions(() => resolve());
            });

            const fcmToken = await registerForPushNotificationsAsync();
            if (fcmToken) {
                await saveFcmTokenToServer(fcmToken, session.token);
                console.log('✅ FCM token saved for user:', session.userId);
            }

            bindListeners(session.userId);
        };

        setupNotifications();

        const appStateSub = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                setupNotifications();
            }
        });

        return () => {
            appStateSub.remove();
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [router]);

    return null;
}

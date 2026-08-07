import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '@/contexts/themeContext';
import NotificationItem from '@/components/more/notifications/NotificationItem';
import Header from '@/components/more/withdraw/Header';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '@/apiConfig';
import { ensureNotificationPermission } from '@/utils/notificationService';
import {
  AppNotification,
  isInteractiveNotification,
  navigateFromNotification,
} from '@/utils/notificationNavigation';

export default function NotificationsScreen() {
  const { dark } = useTheme();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getToken = async () => SecureStore.getItemAsync('auth_token');

  const fetchNotifications = async () => {
    try {
      const token = await getToken();
      const response = await fetch(API_ENDPOINTS.USER.NOTIFICATIONS.List, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await response.json();
      const rawItems = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

      const formatted: AppNotification[] = rawItems.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        description: item.body,
        body: item.body,
        type: item.type,
        data: item.data ?? null,
        is_read: typeof item.is_read === 'boolean' ? item.is_read : Boolean(item.read_at),
        created_at: item.created_at,
      }));
      setNotifications(formatted);

      if (token) {
        const unreadIds = rawItems
          .filter((item: any) => {
            if (typeof item?.is_read === 'boolean') return !item.is_read;
            return !item?.read_at;
          })
          .map((item: any) => item.id);
        await Promise.all(
          unreadIds.map((id: number) =>
            fetch(API_ENDPOINTS.USER.NOTIFICATIONS.MarkRead(id), {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            }).catch(() => null)
          )
        );
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ensureNotificationPermission(true).catch(() => {});
    fetchNotifications();
  }, []);

  const handleNotificationPress = (notification: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
    );

    if (!isInteractiveNotification(notification)) {
      return;
    }

    navigateFromNotification(router, notification);
  };

  const renderNotification = ({ item }: { item: AppNotification }) => (
    <NotificationItem
      notification={item}
      interactive={isInteractiveNotification(item)}
      onPress={handleNotificationPress}
    />
  );

  const renderEmptyState = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 300 }}>
      <Text style={{ color: dark ? '#fff' : '#000', fontSize: 16, textAlign: 'center' }}>
        No notification data found
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, dark ? styles.containerDark : styles.containerLight]}>
      <Header title={'Notifications'} showBackButton={true} onBackPress={() => router.back()} />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: '#F9FAFB',
  },
  containerDark: {
    backgroundColor: 'black',
  },
  listContainer: {
    paddingVertical: 10,
  },
});

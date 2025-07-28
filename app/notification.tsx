import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '@/contexts/themeContext';
import { Notification } from '@/components/types';
import NotificationItem from '@/components/more/notifications/NotificationItem';
import Header from '@/components/more/withdraw/Header';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function NotificationsScreen() {
  const { dark } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const getToken = async () => {
    return await SecureStore.getItemAsync('auth_token');
  };
//    const token=await
     

  const fetchNotifications = async () => {
    try {
      const response = await fetch('https://gympaddy.hmstech.xyz/api/user/notifications', {
        headers: {
          Authorization: `Bearer ${await getToken()}`, // Replace with your auth method
          Accept: 'application/json',
        },
      });
      const data = await response.json();
      console.log("data for notification is ",data )
      const formatted = data.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        description: item.body,
        is_read: item.is_read,
        created_at: item.created_at,
      }));
      setNotifications(formatted);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationPress = (notification: Notification) => {
    // Mark notification as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationItem notification={item} onPress={handleNotificationPress} />
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

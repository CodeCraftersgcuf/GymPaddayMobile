import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';
import { format } from 'date-fns';
import type { AppNotification } from '@/utils/notificationNavigation';

interface NotificationItemProps {
  notification: AppNotification;
  interactive?: boolean;
  onPress?: (notification: AppNotification) => void;
}

export default function NotificationItem({ notification, interactive = false, onPress }: NotificationItemProps) {
  const { dark } = useTheme();
  const isRead = Boolean(notification.is_read ?? notification.isRead);

  const handlePress = () => {
    onPress?.(notification);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        dark ? styles.containerDark : styles.containerLight,
        interactive && styles.interactive,
      ]}
      onPress={handlePress}
      activeOpacity={interactive ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, dark ? styles.messageDark : styles.messageLight]}>
            {notification.title}
          </Text>
          {interactive ? (
            <Ionicons name="chevron-forward" size={16} color={dark ? '#9CA3AF' : '#6B7280'} />
          ) : null}
        </View>
        <Text style={[styles.message, dark ? styles.messageDark : styles.messageLight]}>
          {notification.description || notification.body}
        </Text>
        <View style={styles.header}>
          {!isRead && <View style={styles.unreadIndicator} />}
          <Text style={[styles.timestamp, dark ? styles.timestampDark : styles.timestampLight]}>
            {notification.created_at
              ? format(new Date(notification.created_at), 'MMM d, yyyy · h:mm a')
              : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#181818',
  },
  interactive: {
    borderWidth: 1,
    borderColor: 'rgba(198, 31, 58, 0.12)',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginBottom: 5,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C61F3A',
    marginRight: 12,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 'auto',
  },
  timestampLight: {
    color: '#6B7280',
  },
  timestampDark: {
    color: '#9CA3AF',
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
    marginTop: 4,
  },
  messageLight: {
    color: '#111827',
  },
  messageDark: {
    color: '#F9FAFB',
  },
});

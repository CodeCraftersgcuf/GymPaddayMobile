import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Notification } from '../../types';
import { useTheme } from '@/contexts/themeContext';

interface NotificationItemProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
}

export default function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const { dark } = useTheme();

  const handlePress = () => {
    onPress?.(notification);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        dark ? styles.containerDark : styles.containerLight,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[
          styles.message,
          dark ? styles.messageDark : styles.messageLight
        ]}>
          {notification.message}
        </Text>
        <View style={styles.header}>
          {!notification.isRead && (
            <View style={styles.unreadIndicator} />
          )}
          <Text style={[
            styles.timestamp,
            dark ? styles.timestampDark : styles.timestampLight
          ]}>
            {notification.date} - {notification.timestamp}
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginBottom:5,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
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
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  messageLight: {
    color: '#111827',
  },
  messageDark: {
    color: '#F9FAFB',
  },
});
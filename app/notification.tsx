import React, { useState } from 'react';
import { View, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { mockNotifications } from '@/components/data';
import { useTheme } from '@/contexts/themeContext';
import { Notification } from '@/components/types';
import NotificationItem from '@/components/more/notifications/NotificationItem';
import Header from '@/components/more/withdraw/Header';

export default function NotificationsScreen() {
    const { dark } = useTheme();
    const [notifications, setNotifications] = useState(mockNotifications);

    const handleNotificationPress = (notification: Notification) => {
        // Mark notification as read when pressed
        setNotifications(prev =>
            prev.map(n =>
                n.id === notification.id
                    ? { ...n, isRead: true }
                    : n
            )
        );
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <NotificationItem
            notification={item}
            onPress={handleNotificationPress}
        />
    );

    return (
        <SafeAreaView style={[
            styles.container,
            dark ? styles.containerDark : styles.containerLight
        ]}>
            <Header
                title={'Transactions'}
                showBackButton={true}
                onBackPress={() => { }}
            />
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
            />
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
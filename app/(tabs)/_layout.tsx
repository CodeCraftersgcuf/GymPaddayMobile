import React from 'react';
import { router, Tabs } from 'expo-router';
import { Image, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '@/contexts/themeContext';
import { images } from '@/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/apiConfig';
import { UNREAD_MESSAGES_QUERY_KEY } from '@/utils/queries/chat';

const getTabIconBg = (isFocused: boolean, dark: boolean) => {
  if (isFocused) return dark ? '#FFAAAA' : '#FFAAAA';
  return 'transparent';
};

const getToken = async () => {
  return await SecureStore.getItemAsync('auth_token');
};

async function fetchUnreadCount(): Promise<number> {
  const token = await getToken();
  if (!token) return 0;
  const res = await fetch(API_ENDPOINTS.USER.CHAT_MESSAGES.UnreadCount, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) return 0;
  const json = await res.json();
  return typeof json?.data === 'number' ? json.data : 0;
}

export default function TabLayout() {
  const { dark } = useTheme();
  const isDarkMode = dark;
  const tabBackgroundColor = isDarkMode ? '#252525' : '#FFFFFF';
  const tabViewBackgroundColor = 'transparent';

  const { data: unreadCount = 0, refetch: refetchUnread } = useQuery({
    queryKey: UNREAD_MESSAGES_QUERY_KEY,
    queryFn: fetchUnreadCount,
    placeholderData: 0,
  });

  // Refresh when TabLayout gains focus (e.g. returning from message chat)
  useFocusEffect(
    React.useCallback(() => {
      refetchUnread();
    }, [refetchUnread])
  );

  return (
    <SafeAreaProvider>
      <View style={[styles.tabContainerWrapper, { backgroundColor: tabViewBackgroundColor }]}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: 'black',
            tabBarInactiveTintColor: isDarkMode ? '#888888' : '#666666',
            tabBarStyle: {
              ...styles.tabBar,
              backgroundColor: tabBackgroundColor,
              position: 'absolute',
              bottom: 0,
              alignItems: 'center',
              left: 0,
              right: 0,
              borderTopLeftRadius: 15,
              borderTopRightRadius: 15,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              height: 70,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            },
            tabBarIconStyle: { marginTop: 5 },
            tabBarLabelStyle: [styles.tabBarLabel, { color: isDarkMode ? 'white' : 'black' }],
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Socials',
              tabBarIcon: ({ color, size, focused }) => (
                <View style={[styles.iconWrap, { backgroundColor: getTabIconBg(focused, isDarkMode) }]}>
                  <Image source={images.SocialIcons} style={{ width: size, height: size, tintColor: color }} />
                </View>
              ),
            }}
          />

          <Tabs.Screen
            name="market"
            options={{
              title: 'Market',
              tabBarIcon: ({ color, size, focused }) => (
                <View style={[styles.iconWrap, { backgroundColor: getTabIconBg(focused, isDarkMode) }]}>
                  <Image source={images.marketIcon} style={{ width: size, height: size, tintColor: color }} />
                </View>
              ),
            }}
          />

          <Tabs.Screen
            name="live"
            options={{
              tabBarLabelStyle: { display: 'none' },
              tabBarButton: (props) => (
                <TouchableOpacity
                  {...props}
                  onPress={() => {
                    router.push('/LiveStreamDiscoverScreen');
                  }}
                >
                  <LinearGradient
                    colors={['#940304', '#0000FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.liveIconContainer}
                  >
                    <Image source={images.CreateVideo} style={{ width: 24, height: 24, tintColor: 'white' }} />
                  </LinearGradient>
                </TouchableOpacity>
              ),
            }}
          />

          <Tabs.Screen
            name="chat"
            options={{
              title: 'Messages',
              tabBarIcon: ({ color, size, focused }) => (
                <View style={[styles.iconWrap, { backgroundColor: getTabIconBg(focused, isDarkMode) }]}>
                  <Image source={images.notifcationIcon} style={{ width: size, height: size, tintColor: color }} />
                  {/* Badge */}
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              ),
            }}
          />

          <Tabs.Screen
            name="more"
            options={{
              title: 'More',
              tabBarIcon: ({ color, size, focused }) => (
                <View style={[styles.iconWrap, { backgroundColor: getTabIconBg(focused, isDarkMode) }]}>
                  <Image source={images.MoreIcons} style={{ width: size, height: size, tintColor: color }} />
                </View>
              ),
            }}
          />
        </Tabs>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabContainerWrapper: {
    flex: 1,
  },
  tabBar: {
    height: 60,
    borderRadius: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
    zIndex: 100,
  },
  liveIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#FF759E',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: 10 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  iconWrap: {
    width: 50,
    height: 30,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

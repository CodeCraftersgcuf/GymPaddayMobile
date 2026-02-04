import React from 'react';
import { router, Tabs } from 'expo-router';
import { Image, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '@/contexts/themeContext';
import { images } from '@/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';

const getTabIconBg = (isFocused: boolean, dark: boolean) => {
  if (isFocused) return dark ? '#FFAAAA' : '#FFAAAA';
  return 'transparent';
};

const getToken = async () => {
  return await SecureStore.getItemAsync('auth_token');
};

export default function TabLayout() {
  const { dark } = useTheme();
  const isDarkMode = dark;
  const tabBackgroundColor = isDarkMode ? '#252525' : '#FFFFFF';
  const tabViewBackgroundColor = 'transparent';

  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [loadingUnread, setLoadingUnread] = React.useState<boolean>(false);

  const fetchUnread = React.useCallback(async () => {
    try {
      setLoadingUnread(true);
      const token = await getToken();
      if (!token) {
        setUnreadCount(0);
        return;
      }
      const res = await fetch('https://gympaddy.skillverse.com.pk/api/user/unread-count', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        // If unauthorized or any error, fail gracefully
        setUnreadCount(0);
        return;
      }
      const json = await res.json(); // expects { data: number }
      const count = typeof json?.data === 'number' ? json.data : 0;
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    } finally {
      setLoadingUnread(false);
    }
  }, []);

  // refresh when TabLayout gains focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUnread();
    }, [fetchUnread])
  );

  // optional: refresh once on mount
  React.useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

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

import React from 'react';
import { router, Tabs } from 'expo-router';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/contexts/themeContext';
import { images } from '@/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const getTabIconBg = (isFocused: boolean, dark: boolean) => {
  if (isFocused) return dark ? '#FFAAAA' : '#FFAAAA'; // active: light pink with opacity
  return 'transparent'; // inactive: dark or light gray
};

export default function TabLayout() {
  const { dark } = useTheme();
  const isDarkMode = dark;

  const tabBackgroundColor = isDarkMode ? '#252525' : '#FFFFFF';
  const tabViewBackgroundColor = 'transparent';

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
          tabBarIconStyle: {
            // width: 20,
            // height: 20,
            marginTop: 5,
          },
          tabBarLabelStyle: [styles.tabBarLabel, { color: isDarkMode ? 'white' : 'black' }],
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Socials',
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={{
                  width: 55,
                  height: 35,
                  borderRadius: 20,
                  backgroundColor: getTabIconBg(focused, isDarkMode),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
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
              <View
                style={{
                  width: 50,
                  height: 30,
                  borderRadius: 20,
                  backgroundColor: getTabIconBg(focused, isDarkMode),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
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
                  router.push('/goLive'); // 👈 Navigates to goLive screen
                }}
              >
                <LinearGradient
                  colors={['#FF0000', '#0000FF']}
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
              <View
                style={{
                  width: 50,
                  height: 30,
                  borderRadius: 20,
                  backgroundColor: getTabIconBg(focused, isDarkMode),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Image source={images.notifcationIcon} style={{ width: size, height: size, tintColor: color }} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={{
                  width: 50,
                  height: 30,
                  borderRadius: 20,
                  backgroundColor: getTabIconBg(focused, isDarkMode),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
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
    // borderWidth: 0,
    // paddingBottom:40
  },
  tabBar: {
    // borderWidth: 0,
    height: 60,
    // padding: 10,
    borderRadius: 10,
    // marginHorizontal: 15,
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
    zIndex: 100
  },
  liveIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#FF759E',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // position: 'absolute',
    // top: '50%',
    transform: [{ translateY: 10 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  }
});

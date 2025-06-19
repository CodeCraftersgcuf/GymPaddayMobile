import React from 'react';
import { Tabs } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/themeContext';
import { images } from '@/constants';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  const { dark } = useTheme();
  const isDarkMode = dark;

  const tabBackgroundColor = isDarkMode ? '#252525' : '#FFFFFF';
  const tabViewBackgroundColor = isDarkMode ? 'black' : '#FFFFFF';

  return (
    <View style={[styles.tabContainerWrapper, { backgroundColor: tabViewBackgroundColor }]}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FF759E',
          tabBarInactiveTintColor: isDarkMode ? '#888888' : '#666666',
          tabBarStyle: {
            ...styles.tabBar,
            backgroundColor: tabBackgroundColor,
            position: 'absolute',
            bottom: 20,
            alignItems: 'center',
            left: 20,
            right: 20,
            borderRadius: 15,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          },
          tabBarIconStyle:{
            width: 20,
            height: 20,
            marginTop: 5,
          },
          tabBarLabelStyle: [styles.tabBarLabel , {color:isDarkMode ? 'white' : 'black'}],
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Socials',
            tabBarIcon: ({ color, size }) => (
              <Image source={images.SocialIcons} style={{ width: size, height: size, tintColor: color }} />
            ),
          }}
        />
        <Tabs.Screen
          name="market"
          options={{
            title: 'Market',
            tabBarIcon: ({ color, size }) => (
              <Image source={images.marketIcon} style={{ width: size, height: size, tintColor: color }} />
            ),
          }}
        />
        <Tabs.Screen
          name="live"
          options={{
            tabBarLabelStyle: { display: 'none' },
            tabBarIcon: ({ color, size }) => (
              <LinearGradient
                colors={["#FF0000", "#0000FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.liveIconContainer}
              >
                <Image source={images.CreateVideo} style={{ width: size, height: size, tintColor: 'white' }} />
              </LinearGradient>
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, size }) => (
              <Image source={images.notifcationIcon} style={{ width: size, height: size, tintColor: color }} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ color, size }) => (
              <Image source={images.MoreIcons} style={{ width: size, height: size, tintColor: color }} />
            ),
          }}
        />
      </Tabs>
    </View>
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
    marginHorizontal: 15,
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: '500',
    zIndex:100
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

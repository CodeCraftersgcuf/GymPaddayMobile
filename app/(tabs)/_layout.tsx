import React from 'react';
import { Tabs } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/themeContext';
import { Fontisto } from '@expo/vector-icons';
import { images } from '@/constants';

export default function TabLayout() {
  const { dark } = useTheme();
  const isDarkMode = dark;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF759E',
        tabBarInactiveTintColor: isDarkMode ? '#888888' : '#666666',
        tabBarStyle: {
          ...styles.tabBar,
          backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#333333' : '#EEEEEE',
          borderRadius: 10
        },
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Socials',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              <Image source={images.social} width={size} height={size}  />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          title: 'Connect',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              <Image source={images.connect} width={size} height={size}  />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'Market',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              <Image source={images.market} width={size} height={size}  />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="gymHub"
        options={{
          title: 'Gym Hub',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              <Image source={images.GymTabIcon} width={size} height={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              <Image source={images.moreIcon} width={size} height={size} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingBottom: 5,
    paddingTop: 5,
    elevation: 2,
    shadowOffset: {
      width: 0,
      height: -1,
    },
    margin: 15,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: '500',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
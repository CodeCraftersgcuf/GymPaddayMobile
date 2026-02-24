import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import ThemedView from '@/components/ThemedView';
import ThemeText from '@/components/ThemedText';
import { useTheme } from '@/contexts/themeContext';
import { images } from '@/constants';
import { useRouter } from 'expo-router';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from "@expo-google-fonts/caveat";

import logoNew from '../../assets/images/logo-old.png';

import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';
import { API_ENDPOINTS } from '@/apiConfig';


interface TabHeaderProps {
  title: string;
  admin?: { profile?: string; userId?: string };
  notificationID?: string;
  children?: React.ReactNode;
  refreshing?: boolean; // Add refreshing prop to trigger re-render
}

const TabHeader: React.FC<TabHeaderProps> = ({ title, admin, notificationID, children, refreshing }) => {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  const { dark } = useTheme();
  const router = useRouter();
  const defatulImage = "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400";

  const [profileImage, setProfileImage] = useState<string | null>(defatulImage);
const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        setUnreadCount(0);
        return;
      }

      const res = await fetch(API_ENDPOINTS.USER.NOTIFICATIONS.Unread, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        setUnreadCount(0);
        return;
      }

      const json = await res.json();
      const notificationsArray = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.notifications)
            ? json.notifications
            : [];

      const count = typeof json?.count === 'number'
        ? json.count
        : typeof json?.data?.count === 'number'
          ? json.data.count
          : typeof json?.data === 'number'
        ? json.data
        : notificationsArray.length;
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
      setUnreadCount(0);
    }
  };

  React.useEffect(() => {
    (async () => {
      try {
        const userDataStr = await SecureStore.getItemAsync('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUserId(userData.id.toString());
          if (userData.profile_picture_url) {
            setProfileImage(userData.profile_picture_url);
          } else {
            setProfileImage(defatulImage);
          }
        } else {
          setProfileImage(defatulImage);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setProfileImage(defatulImage);
      }
    })();
    fetchUnreadCount();
  }, [refreshing]); // Add refreshing as dependency

  React.useEffect(() => {
    if (!notificationID) return;

    // Keep bell indicator fresh for admin-sent notifications.
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [notificationID]);
  const themeStyles = StyleSheet.create({
    notificationView: {
      backgroundColor: dark ? '#212121' : '#e5e5e5',
      borderColor: dark ? '#282828' : '#E5E5E5',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      width: 35,
      height: 35,
    },
  });

  const hanldeViewProfile = (id: any) => {
    // router.push({
    //   pathname: '/UserProfile',
    //   params: { user_id: id },
    // })
router.push({ pathname: '/UserProfile', params: { user_id: userId?.toString() } })
    // router.push('/EditProfile');
  }

  return (
    <ThemedView darkColor="black" style={styles.header}>
<Image source={logoNew} style={styles.logo} resizeMode="contain" />
      <ThemedView style={styles.alignCenter}>
        {admin?.profile && (
          <Pressable onPress={() => hanldeViewProfile()}>
            <Image source={{ uri: profileImage }} style={styles.UserImage} />
          </Pressable>
        )}
        {children}
       {notificationID && (
  <View style={{ flexDirection: 'row', gap: 10 }}>
    <Pressable onPress={() => router.push('/search')}>
      <ThemedView style={themeStyles.notificationView}>
        <Feather name="search" size={20} color={dark ? '#fff' : '#000'} />
      </ThemedView>
    </Pressable>
    <Pressable onPress={() => router.push('/notification')}>
      <ThemedView style={themeStyles.notificationView}>
        <Image
          source={images.bellIcon}
          tintColor={dark ? 'white' : 'black'}
          style={styles.notifcationIcon}
        />
        {unreadCount > 0 && <View style={styles.unreadDot} />}
      </ThemedView>
    </Pressable>
  </View>
)}

      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  alignCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  UserImage: {
    width: 35,
    height: 35,
    borderRadius: 35,
  },
  notifcationIcon: {
    width: 25,
    height: 25,
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  logo: {
  width: 120, // ✅ Adjust as needed
  height: 60,
  textAlign:'left',
  marginLeft:-20
  
},

});

export default TabHeader;
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import ThemedView from '@/components/ThemedView';
import ThemeText from '@/components/ThemedText';
import { useTheme } from '@/contexts/themeContext';
import { images } from '@/constants';
import { useRouter } from 'expo-router';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from "@expo-google-fonts/caveat";


import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';


interface TabHeaderProps {
  title: string;
  admin?: { profile?: string; userId?: string };
  notificationID?: string;
  children?: React.ReactNode;
}

const TabHeader: React.FC<TabHeaderProps> = ({ title, admin, notificationID, children }) => {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  const { dark } = useTheme();
  const router = useRouter();
  const defatulImage = "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400";

  const [profileImage, setProfileImage] = useState<string | null>(defatulImage);

  const hanldeViewProfile = (id: any) => {
    // router.push({
    //   pathname: '/UserProfile',
    //   params: { user_id: id },
    // })

    router.push('/EditProfile');
  }

  React.useEffect(() => {
    (async () => {
      try {
        const userDataStr = await SecureStore.getItemAsync('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData.profile_picture_url) {
            setProfileImage(userData.profile_picture_url);
          } else {
            setProfileImage(defatulImage); // fallback to prop
          }
        } else {
          setProfileImage(defatulImage); // fallback to prop
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setProfileImage(defatulImage); // fallback to prop
      }
    })();
  }, []);
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

  return (
    <ThemedView darkColor="black" style={styles.header}>
      <ThemeText style={{ fontFamily: 'Caveat_400Regular', fontSize: 34, color: 'red' }}>{title}</ThemeText>
      <ThemedView style={styles.alignCenter}>
        {admin?.profile && (
          <Pressable onPress={() => hanldeViewProfile(admin.userId ?? 12)}>
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
});

export default TabHeader;
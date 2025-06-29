import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import ThemedView from '@/components/ThemedView';
import ThemeText from '@/components/ThemedText';
import { useTheme } from '@/contexts/themeContext';
import { images } from '@/constants';
import { useRouter } from 'expo-router';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from "@expo-google-fonts/caveat";

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
  const hanldeViewProfile = (id: any) => {
    router.push({
      pathname: '/UserProfile',
      params: { user_id: id },
    })
  }

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
            <Image source={{ uri: admin.profile }} style={styles.UserImage} />
          </Pressable>
        )}
        {children}
        {notificationID && (
          <Pressable onPress={() => console.log(`Notification ID: ${notificationID}`)}>
            <ThemedView style={themeStyles.notificationView}>
              <Image
                source={images.bellIcon}
                tintColor={dark ? 'white' : 'black'}
                style={styles.notifcationIcon}
              />
            </ThemedView>
          </Pressable>
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
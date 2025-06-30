import { useTheme } from '@/contexts/themeContext';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
} from 'react-native';

interface UserSectionProps {
  postText: string;
  onTextChange: (text: string) => void;
}

import * as SecureStore from 'expo-secure-store';

export default function UserSection({ postText, onTextChange }: UserSectionProps) {
  const { dark } = useTheme();
  const defatulImage = "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400";

  const [profileImage, setProfileImage] = useState<string | null>(defatulImage);

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
  return (
    <View style={[styles.container, { backgroundColor: dark ? 'black' : '#fff', }]}>
      <View style={styles.userInfo}>
        <Image
          source={{ uri: profileImage }}
          style={styles.avatar}
        />
        <TextInput
          style={[styles.textInput, { color: dark ? 'white' : 'black' }]}
          placeholder="What is on your mind?"
          placeholderTextColor={"#999"}
          multiline
          value={postText}
          onChangeText={onTextChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,

  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
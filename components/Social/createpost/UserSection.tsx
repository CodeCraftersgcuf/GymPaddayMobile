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
  disabled?: boolean;
}

import * as SecureStore from 'expo-secure-store';

export default function UserSection({ postText, onTextChange, disabled = false }: UserSectionProps) {
  const theme = useTheme();
  const dark = theme?.dark ?? false; // Safety check
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
        <View style={{ flex: 1 }}>
          <TextInput
            style={[styles.textInput, { color: dark ? 'white' : 'black' }]}
            placeholder=" Let's see what you got!"
            placeholderTextColor={"#999"}
            multiline
            value={postText}
            onChangeText={(text) => {
              // Strictly enforce 500 character limit
              if (text.length <= 500) {
                onTextChange(text);
              } else {
                // If user tries to paste or type beyond limit, truncate and notify
                const truncated = text.substring(0, 500);
                onTextChange(truncated);
              }
            }}
            editable={!disabled}
            maxLength={500}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 44 }}>
            {postText.length >= 450 && (
              <Text style={{ fontSize: 11, color: postText.length >= 500 ? '#F44336' : '#FF9800', flex: 1 }}>
                {postText.length >= 500 ? 'Character limit reached!' : `Approaching limit (${500 - postText.length} remaining)`}
              </Text>
            )}
            <Text style={{ 
              fontSize: 12, 
              color: postText.length >= 500 
                ? '#F44336' 
                : postText.length >= 450 
                  ? '#FF9800' 
                  : dark ? '#666' : '#999', 
              textAlign: 'right',
              fontWeight: postText.length >= 450 ? '600' : '400'
            }}>
              {postText.length}/500 characters
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 24,
    marginBottom: 8,
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
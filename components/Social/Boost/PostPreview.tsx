import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { colors } from './colors';

import * as SecureStore from 'expo-secure-store';

type PostPreviewProps = {
  isDark: boolean;
  image?: string;     // passed image url
  id?: string | number; // passed post id (optional for display)
  description?: string; // You can also pass description if you want dynamic!
  username?: string;    // You could add username too (extend if needed)
};

const PostPreview: React.FC<PostPreviewProps> = ({ isDark, image, id, description, username }) => {
  const theme = isDark ? colors.dark : colors.light;

  // Fallback to a default image if none provided
  const displayImage =
    image && typeof image === 'string' && image.length > 0
      ? image
      : 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1';

  const dummyImage = "https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg";
  const [profileImage, setProfileImage] = useState<string | null>(dummyImage);
  const [userName, setUserName] = useState<string | null>(username || 'Maleekfrenzy');
  React.useEffect(() => {
    (async () => {
      try {
        const userDataStr = await SecureStore.getItemAsync('user_data');
        const userNameStr = await SecureStore.getItemAsync('username');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          if (userData.profile_picture_url) {
            setProfileImage(userData.profile_picture_url);
            if (userNameStr) {
              setUserName(userNameStr);
            } else {
              setUserName(userData.username || 'Maleekfrenzy');
            }
          } else {
            setProfileImage(dummyImage);
          }
        } else {
          setProfileImage(dummyImage);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setProfileImage(dummyImage);
      }
    })();
  }, []);
  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Image
          source={{ uri: profileImage }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: theme.text }]}>{userName || 'Maleekfrenzy'}</Text>
          <Text style={[styles.sponsored, { color: colors.light.primary }]}>Sponsored post</Text>
        </View>
      </View>

      <Image
        source={{ uri: displayImage }}
        style={styles.postImage}
        resizeMode="cover"
      />

      <View style={[styles.descriptionContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.descriptionLabel, { color: theme.textSecondary }]}>Description</Text>
        <Text style={[styles.description, { color: theme.text }]}>
          {description || "Always try to be the best you can be, strive for the best, put in the work and you will achieve your goals."}
        </Text>
        {/* If you want to show post id for debugging */}
        {/* <Text style={{ fontSize: 12, color: theme.textSecondary }}>Post ID: {id}</Text> */}
      </View>
    </View>
  );
};

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  avatar: ImageStyle;
  userInfo: ViewStyle;
  username: TextStyle;
  sponsored: TextStyle;
  postImage: ImageStyle;
  descriptionContainer: ViewStyle;
  descriptionLabel: TextStyle;
  description: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  sponsored: {
    fontSize: 14,
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#ddd'
  },
  descriptionContainer: {
    padding: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
});

export default PostPreview;

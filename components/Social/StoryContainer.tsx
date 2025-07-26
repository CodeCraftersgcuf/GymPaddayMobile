import React, { use, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import Story from './Story';
// import { GroupedUserStories } from '@/types/story';
import { dummyImage } from '@/constants/help';
import ThemeText from '../ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/themeContext';
import { useRouter } from 'expo-router';
import { GroupedUserStories } from '@/utils/types/story';

import * as SecureStore from 'expo-secure-store';

interface Props {
  stories: GroupedUserStories[];
}

const StoryContainer: React.FC<Props> = ({ stories }) => {
  const router = useRouter();
  const { dark } = useTheme();
  const defatulImage = "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400";
  const [user,setUser]=useState();
  const [profileImage, setProfileImage] = useState<string | null>(defatulImage);

  React.useEffect(() => {
    (async () => {
      try {
        const userDataStr = await SecureStore.getItemAsync('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUser(userData);
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
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* My Story */}
        <TouchableOpacity onPress={() => router.push('/AddToStoryScreen')} style={styles.storyItem}>
          <LinearGradient
            colors={['#FF0000', '#0000FF']}
            style={styles.gradientBorder}
          >
            <Image source={{ uri: profileImage }} style={styles.myStoryImage} />
          </LinearGradient>
          <View style={[styles.addButton, { backgroundColor: dark ? '#222' : 'red' }]}>
            <ThemeText style={styles.addButtonText}>+</ThemeText>
          </View>
          <ThemeText style={styles.storyName}>Add Story</ThemeText>
        </TouchableOpacity>

        {/* Other User Stories */}
        <FlatList
          data={stories}
          keyExtractor={(item) => item.user.id.toString()}
          horizontal
          renderItem={({ item }) => <Story story={item} userId={user?.id} />}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    position: 'relative',
  },
  myStoryImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  gradientBorder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  storyName: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default StoryContainer;

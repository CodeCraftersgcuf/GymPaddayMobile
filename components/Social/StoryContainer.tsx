import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Story from './Story';
import ThemeText from '../ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { CachedAvatar } from '@/components/media/CachedImage';
import { useTheme } from '@/contexts/themeContext';
import { useRouter } from 'expo-router';
import { GroupedUserStories } from '@/utils/types/story';
import { prefetchGroupedStories } from '@/utils/storyPrefetch';

import * as SecureStore from 'expo-secure-store';

interface Props {
  stories: GroupedUserStories[];
  refreshing?: boolean;
}

const StoryContainer: React.FC<Props> = ({ stories, refreshing }) => {
  const router = useRouter();
  const { dark } = useTheme();
  const defatulImage = "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400";
  const [user, setUser] = useState<any>();
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
  }, [refreshing]);

  const myStoryGroup = useMemo(
    () => stories.find((s) => String(s.user.id) === String(user?.id)),
    [stories, user?.id],
  );

  const otherStories = useMemo(
    () => stories.filter((s) => String(s.user.id) !== String(user?.id)),
    [stories, user?.id],
  );

  const hasMyStory = (myStoryGroup?.stories?.length ?? 0) > 0;

  const openMyStory = useCallback(() => {
    if (!myStoryGroup) return;
    prefetchGroupedStories([myStoryGroup], { priorityUserCount: 1 });
    router.push({
      pathname: '/UserStoryPreview',
      params: {
        userId: String(myStoryGroup.user.id),
        startIndex: '0',
        selected: JSON.stringify(myStoryGroup.stories),
      },
    });
  }, [myStoryGroup, router]);

  const openAddStory = useCallback(() => router.push('/AddToStoryScreen'), [router]);

  const renderMyStory = useCallback(() => (
    <View style={styles.storyItem}>
      <TouchableOpacity
        onPress={hasMyStory ? openMyStory : openAddStory}
        activeOpacity={0.85}
      >
        <LinearGradient colors={['#940304', '#0000FF']} style={styles.gradientBorder}>
          <CachedAvatar uri={profileImage} size={56} style={styles.myStoryImage} />
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={openAddStory}
        style={[styles.addButton, { backgroundColor: dark ? '#222' : 'red' }]}
        hitSlop={6}
      >
        <ThemeText style={styles.addButtonText}>+</ThemeText>
      </TouchableOpacity>
      <ThemeText style={styles.storyName}>
        {hasMyStory ? 'My Story' : 'Add Story'}
      </ThemeText>
    </View>
  ), [dark, hasMyStory, openAddStory, openMyStory, profileImage]);

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={otherStories}
        keyExtractor={(item) => item.user.id.toString()}
        showsHorizontalScrollIndicator={false}
        ListHeaderComponent={renderMyStory}
        renderItem={({ item }) => <Story story={item} userId={user?.id} />}
      />
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

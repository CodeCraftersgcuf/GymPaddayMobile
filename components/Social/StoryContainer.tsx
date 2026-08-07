import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Story from './Story';
import ThemeText from '../ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import { CachedAvatar } from '@/components/media/CachedImage';
import { useTheme } from '@/contexts/themeContext';
import { useRouter } from 'expo-router';
import { GroupedUserStories } from '@/utils/types/story';
import { prefetchGroupedStories } from '@/utils/storyPrefetch';
import { getPendingMyStories, getLastAuthUserId, setLastAuthUserId } from '@/utils/pendingMyStories';

import * as SecureStore from 'expo-secure-store';

interface Props {
  stories: GroupedUserStories[];
  refreshing?: boolean;
}

const StoryContainer: React.FC<Props> = ({ stories }) => {
  const router = useRouter();
  const { dark } = useTheme();
  const [user, setUser] = useState<any>(() =>
    getLastAuthUserId() != null ? { id: getLastAuthUserId() } : null,
  );
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const userLoadedRef = useRef(false);

  // Load user once — do not re-run on refresh (that caused a visible blink).
  useEffect(() => {
    if (userLoadedRef.current) return;
    userLoadedRef.current = true;
    (async () => {
      try {
        const userDataStr = await SecureStore.getItemAsync('user_data');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setLastAuthUserId(userData.id);
          setUser(userData);
          setProfileImage(userData.profile_picture_url || null);
        } else {
          setProfileImage(null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setProfileImage(null);
      }
    })();
  }, []);

  const myUserId = user?.id ?? getLastAuthUserId();

  const myStoryGroup = useMemo(() => {
    if (myUserId == null) return undefined;
    return stories.find((s) => String(s.user.id) === String(myUserId));
  }, [stories, myUserId]);

  const otherStories = useMemo(() => {
    if (myUserId == null) return stories;
    return stories.filter((s) => String(s.user.id) !== String(myUserId));
  }, [stories, myUserId]);

  const pendingCount = myUserId != null ? getPendingMyStories(myUserId).length : 0;
  const hasMyStory =
    (myStoryGroup?.stories?.length ?? 0) > 0 || pendingCount > 0;

  const openMyStory = useCallback(() => {
    const pending = myUserId != null ? getPendingMyStories(myUserId) : [];
    const storiesToOpen =
      myStoryGroup?.stories?.length ? myStoryGroup.stories : pending;
    if (!storiesToOpen.length) {
      router.push('/AddToStoryScreen');
      return;
    }
    const group = myStoryGroup ?? {
      user: user ?? { id: myUserId, username: 'You', fullname: 'You', email: '', profile_picture_url: '' },
      stories: storiesToOpen,
    };
    prefetchGroupedStories([group], { priorityUserCount: 1 });
    router.push({
      pathname: '/UserStoryPreview',
      params: {
        userId: String(group.user.id),
        startIndex: '0',
        selected: JSON.stringify(storiesToOpen),
      },
    });
  }, [myStoryGroup, myUserId, router, user]);

  const openAddStory = useCallback(() => router.push('/AddToStoryScreen'), [router]);

  const renderMyStory = useCallback(
    () => (
      <View style={styles.storyItem}>
        <TouchableOpacity
          onPress={hasMyStory ? openMyStory : openAddStory}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#C61F3A', '#9B1830']} style={styles.gradientBorder}>
            <CachedAvatar uri={profileImage} size={56} style={styles.myStoryImage} />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={openAddStory}
          style={[styles.addButton, { backgroundColor: dark ? '#222' : '#C61F3A' }]}
          hitSlop={6}
        >
          <ThemeText style={styles.addButtonText}>+</ThemeText>
        </TouchableOpacity>
        <ThemeText style={styles.storyName}>
          {hasMyStory ? 'My Story' : 'Add Story'}
        </ThemeText>
      </View>
    ),
    [dark, hasMyStory, openAddStory, openMyStory, profileImage],
  );

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={otherStories}
        keyExtractor={(item) => item.user.id.toString()}
        showsHorizontalScrollIndicator={false}
        ListHeaderComponent={renderMyStory}
        extraData={`${hasMyStory}-${myUserId}-${otherStories.length}`}
        renderItem={({ item }) => <Story story={item} userId={myUserId} />}
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

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ThemeText from '../ThemedText';
import { CachedAvatar } from '@/components/media/CachedImage';
import { GroupedUserStories } from '@/utils/types/story';
import { prefetchGroupedStories } from '@/utils/storyPrefetch';

interface Props {
  story: GroupedUserStories;
  userId?: string; // Logged-in user's ID
}

const StoryComponent: React.FC<Props> = ({ story, userId }) => {
  const router = useRouter();
// console.log("story",story)
  const handlePressIn = () => {
    prefetchGroupedStories([story], { priorityUserCount: 1 });
  };

  const handlePress = () => {
    prefetchGroupedStories([story], { priorityUserCount: 1 });
    router.push({
      pathname: '/UserStoryPreview',
      params: {
        userId: String(story.user.id),
        startIndex: '0',
        selected: JSON.stringify(story.stories),
      },
    });
  };

  // If the logged-in user is the same as the story owner
  const isCurrentUser = story.user.id?.toString() === userId?.toString();

  return (
    <TouchableOpacity
      style={styles.container}
      onPressIn={handlePressIn}
      onPress={handlePress}
    >
      <LinearGradient colors={["#C61F3A", "#9B1830"]} style={styles.gradient}>
        <CachedAvatar uri={story.user.profile_picture_url} size={56} style={styles.avatar} />
      </LinearGradient>
      <ThemeText style={styles.name}>
        {isCurrentUser ? 'My Story' : story.user.username}
      </ThemeText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  gradient: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#222',
  },
  name: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
});

const Story = React.memo(StoryComponent);

export default Story;

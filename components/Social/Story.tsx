import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ThemeText from '../ThemedText';
import { GroupedUserStories } from '@/utils/types/story';

interface Props {
  story: GroupedUserStories;
  userId?: string; // Logged-in user's ID
}

const Story: React.FC<Props> = ({ story, userId }) => {
  const router = useRouter();

  const handlePress = () => {
    console.log('Story pressed:', story.stories);
    router.push({
      pathname: '/UserStoryPreview',
      params: {
        selected: JSON.stringify(story.stories),
      },
    });
  };

  // If the logged-in user is the same as the story owner
  const isCurrentUser = story.user.id?.toString() === userId?.toString();

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <LinearGradient colors={["#FF0000", "#0000FF"]} style={styles.gradient}>
        <Image source={{ uri: story.user.profile_picture_url }} style={styles.avatar} />
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

export default Story;

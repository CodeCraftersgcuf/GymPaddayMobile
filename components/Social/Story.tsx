import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StoryData } from './mockData';
import ThemeText from '../ThemedText';

interface StoryProps {
  story: StoryData;
}

const Story: React.FC<StoryProps> = ({ story }) => {
  // Choose gradient colors based on story state
  const getGradientColors = () => {
    if (story.isLive) {
      return ['#ff0080', '#7928ca'];
    } else if (story.hasStory) {
      return story.viewedStory
        ? ['#aaa', '#555']
        : ['#ff0080', '#7928ca'];
    }
    return ['#ccc', '#ccc'];
  };

  return (
    <View style={styles.storyItem}>
      <TouchableOpacity>
        <View style={styles.gradientBorderContainer}>
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <Image
              source={{ uri: story.profileImage }}
              style={styles.storyImage}
            />
            {story.isLive && (
              <LinearGradient
                colors={['#ff0080', '#7928ca']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.liveIndicator}
              >
                <Text style={styles.liveText}>LIVE</Text>
              </LinearGradient>
            )}
          </LinearGradient>
        </View>
        <ThemeText style={styles.storyName}>{story.username}</ThemeText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  gradientBorderContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradientBorder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  storyImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#212121',
  },
  liveIndicator: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
    backgroundColor: '#ff0000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 2,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  storyName: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default Story;
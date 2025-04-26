import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { StoryData } from './mockData';
import ThemeText from '../ThemedText';

interface StoryProps {
  story: StoryData;
}

const Story: React.FC<StoryProps> = ({ story }) => {
  // Function to generate gradient border style
  const getBorderStyle = () => {
    if (story.isLive) {
      return { 
        borderWidth: 3,
        borderColor: '#ff0000'
      };
    } else if (story.hasStory) {
      return { 
        borderWidth: 3,
        borderColor: story.viewedStory ? '#555' : '#ff3333'
      };
    }
    return { borderWidth: 0 };
  };

  return (
    <View style={styles.storyItem}>
      <TouchableOpacity>
        <View style={[styles.storyImageContainer, getBorderStyle()]}>
          <Image 
            source={{ uri: story.profileImage }} 
            style={styles.storyImage}
          />
          {story.isLive && (
            <View style={styles.liveIndicator}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
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
  storyImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    position: 'relative',
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#000',
  },
  liveIndicator: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#ff0000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#000',
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  storyName: {
    fontSize: 14,
    marginTop: 5,
    textAlign:'center',
  },
});

export default Story;
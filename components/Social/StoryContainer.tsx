import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList
} from 'react-native';
import Story from './Story';
import { StoryData } from './mockData';
import { dummyImage } from '@/constants/help';
import { Image } from 'react-native';
import ThemeText from '../ThemedText';
import { useTheme } from '@/contexts/themeContext';

interface StoryContainerProps {
  stories: StoryData[];
}

const StoryContainer: React.FC<StoryContainerProps> = ({ stories }) => {
  const {dark} = useTheme();
  return (
    <View style={[styles.container]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* My Story */}
        <View style={styles.storyItem}>
          <TouchableOpacity>
            <View style={[styles.myStoryImageContainer]}>
              <Image source={{uri:dummyImage()}} style={[styles.myStoryImage]} />
              <View style={[styles.addButton,{backgroundColor:dark ? '#222' : 'red'}]}>
                <ThemeText style={styles.addButtonText}>+</ThemeText>
              </View>
            </View>
            <ThemeText style={styles.storyName}>My Story</ThemeText>
          </TouchableOpacity>
        </View>

        {/* Other Stories */}
        <FlatList
          data={stories}
          keyExtractor={(story) => story.id.toString()}
          renderItem={({ item }) => <Story story={item} />}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 0,
    marginBottom:10
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  myStoryButton: {
    alignItems: 'center',
  },
  myStoryImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
    position: 'relative',
  },
  myStoryImage: {
    width: 65,
    height: 65,
    borderRadius: 37.5,
    backgroundColor: '#212121'
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  storyName: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center'
  },
});

export default StoryContainer;
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  FlatList,
  StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons as Icon } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '@/contexts/themeContext';

const { width, height } = Dimensions.get('window');

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
}

const postImages = [
  'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
  'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg',
  'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
  'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg',
  'https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg',
  'https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg',
  'https://images.pexels.com/photos/1552103/pexels-photo-1552103.jpeg',
  'https://images.pexels.com/photos/1552245/pexels-photo-1552245.jpeg',
  'https://images.pexels.com/photos/1552238/pexels-photo-1552238.jpeg',
];

// Sample video URLs (using sample video URLs for demo)
const postVideos = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg',
  'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
  'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg',
  'https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg',
  'https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg',
  'https://images.pexels.com/photos/1552103/pexels-photo-1552103.jpeg',
];

export default function MediaViewer() {
  const params = useLocalSearchParams();
  const initialIndex = parseInt(params.index as string) || 0;
  const mediaType = params.type as string || 'posts';

  // Get media data from params if available (from API)
  let mediaData: { uri: string; type: 'image' | 'video'; media_type?: string }[] = [];

  if (Array.isArray(params.mediaArray)) {
    // If mediaArray is passed as a param (stringified), parse it
    try {
      mediaData = JSON.parse(params.mediaArray as string);
    } catch {
      mediaData = [];
    }
  } else if (params.url && params.media_type) {
    // If only a single media is passed
    mediaData = [{ uri: params.url as string, type: params.media_type as 'image' | 'video', media_type: params.media_type as string }];
  } else {
    // fallback to dummy data for dev
    mediaData = mediaType === 'videos'
      ? postVideos.map((uri, index) => ({
          uri,
          type: index < 3 ? 'video' : 'image'
        }))
      : postImages.map(uri => ({ uri, type: 'image' as const }));
  }

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);

  const {dark} = useTheme(); // You can change this to toggle theme

  const theme = {
    background: dark ? '#000000' : '#ffffff',
    text: dark ? '#ffffff' : '#000000',
    textSecondary: dark ? '#999999' : '#666666',
  };

  const renderMediaItem = ({ item, index }: { item: any; index: number }) => {
    // Prefer media_type if present, else fallback to type
    const type = item.media_type || item.type;
    return (
      <View style={styles.mediaContainer}>
        {type === 'image' ? (
          <Image 
            source={{ uri: item.uri }} 
            style={styles.mediaImage}
            resizeMode="contain"
          />
        ) : (
          <Video
            source={{ uri: item.uri }}
            style={styles.mediaVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={index === currentIndex} // Only play current video
          />
        )}
      </View>
    );
  };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Icon name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {mediaType === 'videos' ? 'Videos' : 'Posts'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {currentIndex + 1} of {mediaData.length}
          </Text>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Icon name="ellipsis-vertical" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Media Viewer */}
      <FlatList
        ref={flatListRef}
        data={mediaData}
        renderItem={renderMediaItem}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: theme.background }]}>
        {/* <TouchableOpacity style={styles.actionButton}>
          <Icon name="heart-outline" size={28} color={theme.text} />
        </TouchableOpacity>
         */}
        {/* <TouchableOpacity style={styles.actionButton}>
          <Icon name="chatbubble-outline" size={28} color={theme.text} />
        </TouchableOpacity> */}
        
        {/* <TouchableOpacity style={styles.actionButton}>
          <Icon name="paper-plane-outline" size={28} color={theme.text} />
        </TouchableOpacity> */}
        
        <View style={styles.actionSpacer} />
{/*         
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="bookmark-outline" size={28} color={theme.text} />
        </TouchableOpacity> */}
      </View>

      {/* Page Indicator */}
      <View style={styles.pageIndicator}>
        {mediaData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentIndex ? theme.text : theme.textSecondary,
                opacity: index === currentIndex ? 1 : 0.3,
              }
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  mediaContainer: {
    width,
    height: height - 200, // Adjust for header and bottom actions
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaVideo: {
    width: '100%',
    height: '100%',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  actionButton: {
    padding: 8,
    marginRight: 16,
  },
  actionSpacer: {
    flex: 1,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
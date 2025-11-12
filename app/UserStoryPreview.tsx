import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  ActivityIndicator,
  Pressable,
  Text,
} from 'react-native';
import { Audio, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StoryItem } from '@/utils/types/story';
import CachedImage from 'expo-cached-image';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 4000; // Reduced from 5000ms to 4000ms for faster transitions

const fixUrl = (url: string) =>
  url?.replace('https://gympaddy.hmstech.xyz/storage//', 'https://gympaddy.hmstech.xyz/storage/');

const UserStoryPreview = () => {
  const { selected } = useLocalSearchParams();
  const router = useRouter();

  const stories: StoryItem[] = JSON.parse(selected as string || '[]');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const currentStory = stories[currentIndex];
  const fixedUrl = fixUrl(currentStory?.full_media_url);
  const [musicSound, setMusicSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const cleanupMedia = async () => {
      setIsMediaLoaded(false);
      progress.setValue(0);

      if (musicSound) {
        await musicSound.stopAsync();
        await musicSound.unloadAsync();
        setMusicSound(null);
      }
    };

    const playMusicAfterMediaLoads = async () => {
      if (currentStory?.music_url) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: currentStory.music_url },
            { shouldPlay: true }
          );
          if (!isCancelled) setMusicSound(sound);
        } catch (err) {
          console.warn('Failed to play music:', err);
        }
      }
    };

    cleanupMedia();

    return () => {
      isCancelled = true;
      cleanupMedia();
    };
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      if (musicSound) {
        musicSound.stopAsync();
        musicSound.unloadAsync();
      }
    };
  }, [musicSound]);

  useEffect(() => {
    if (isMediaLoaded && currentStory?.media_type === 'photo' && !isPaused) {
      animationRef.current = Animated.timing(progress, {
        toValue: 1,
        duration: STORY_DURATION,
        useNativeDriver: false,
      });
      animationRef.current.start(({ finished }) => {
        if (finished) handleNext();
      });
    }
  }, [isMediaLoaded, isPaused]);

  const handleNext = useCallback(() => {
    if (animationRef.current) animationRef.current.stop();
    
    // Faster state update
    setIsMediaLoaded(false);
    
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.back();
    }
  }, [currentIndex, stories.length, router]);

  const handlePrev = useCallback(() => {
    if (animationRef.current) animationRef.current.stop();
    
    setIsMediaLoaded(false);
    
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  }, [currentIndex, router]);

  const handlePressIn = () => {
    setIsPaused(true);
    animationRef.current?.stop();
    videoRef.current?.pauseAsync?.();
  };

  const handlePressOut = () => {
    setIsPaused(false);
    if (currentStory?.media_type === 'photo') {
      const remaining = (1 - (progress as any)._value) * STORY_DURATION;
      animationRef.current = Animated.timing(progress, {
        toValue: 1,
        duration: remaining,
        useNativeDriver: false,
      });
      animationRef.current.start(({ finished }) => {
        if (finished) handleNext();
      });
    } else {
      // ✅ Resume video
      videoRef.current?.playAsync?.();
    }
  };
const playMusicAfterMediaLoads = async () => {
  console.log('playMusicAfterMediaLoads and current stories', currentStory);
  if (currentStory?.music_url) {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: currentStory.music_url },
        { shouldPlay: true }
      );
      setMusicSound(sound);
    } catch (err) {
      console.warn('Failed to play music:', err);
    }
  }
};
// Enhanced preloading - preload next 2 stories for ultra-smooth transitions
useEffect(() => {
  const preloadStories = async () => {
    // Preload next story
    const nextStory = stories[currentIndex + 1];
    if (nextStory) {
      const nextUrl = fixUrl(nextStory.full_media_url);
      if (nextStory.media_type === 'photo') {
        Image.prefetch(nextUrl).catch(() => {}); // Silent fail
      } else if (nextStory.media_type === 'video') {
        try {
          await Video.prefetchAsync(nextUrl);
        } catch (e) {
          // Silent fail for better UX
        }
      }
    }

    // Also preload the story after next for even smoother experience
    const nextNextStory = stories[currentIndex + 2];
    if (nextNextStory) {
      const nextNextUrl = fixUrl(nextNextStory.full_media_url);
      if (nextNextStory.media_type === 'photo') {
        Image.prefetch(nextNextUrl).catch(() => {});
      }
    }
  };

  preloadStories();
}, [currentIndex, stories]);


  const renderMedia = () => {
    if (!currentStory) return null;

    if (currentStory.media_type === 'photo') {
      return (
        <>
          <CachedImage
            source={{ uri: fixedUrl }}
            cacheKey={`story-${currentStory.id}`} // makes it unique per story
            style={styles.media}
            resizeMode="cover"
onLoad={async () => {
  setIsMediaLoaded(true);
  if (!isPaused) {
    await videoRef.current?.playAsync?.();
  }

  if (currentStory?.music_url) {
    await playMusicAfterMediaLoads(); // <-- THIS LINE FIXES THE MUSIC
  }
}}

            
          />
          {!isMediaLoaded && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </>
      );
    }


    return (
      <>
        <Video
          ref={(ref) => (videoRef.current = ref)}
          source={{ uri: fixedUrl }}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="cover"
          shouldPlay={!isPaused}
          style={styles.media}
onLoad={async () => {
  setIsMediaLoaded(true);
  if (!isPaused) {
    await videoRef.current?.playAsync?.();
  }

  if (currentStory?.music_url) {
    console.log("Video loaded, calling playMusicAfterMediaLoads");
    await playMusicAfterMediaLoads();
  }
}}
// }}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              if (status.didJustFinish) {
                handleNext();
              } else if (!status.isPlaying && !isPaused) {
                videoRef.current?.playAsync?.();
              }
            }
          }}
        />
        {!isMediaLoaded && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </>
    );
  };


  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {stories.map((_, index) => (
        <View key={index} style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              index === currentIndex && {
                flex: progress,
              },
              index < currentIndex && {
                backgroundColor: '#fff',
                flex: 1,
              },
              index > currentIndex && {
                backgroundColor: '#ffffff55',
                flex: 0,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderMedia()}
      {renderProgressBar()}
      
      {/* Left tap zone - Previous */}
      <Pressable
        style={styles.leftTapZone}
        onPress={handlePrev}
        onLongPress={handlePressIn}
        onPressOut={handlePressOut}
      />
      
      {/* Right tap zone - Next */}
      <Pressable
        style={styles.rightTapZone}
        onPress={handleNext}
        onLongPress={handlePressIn}
        onPressOut={handlePressOut}
      />

      {/* Music indicator */}
      {currentStory?.music_url && (
        <View style={styles.musicIndicator}>
          <Ionicons name="musical-note" size={16} color="#fff" />
          <Text style={styles.musicText} numberOfLines={1}>
            {currentStory.music_title || 'Playing music'}
          </Text>
        </View>
      )}

      {/* Story counter */}
      <View style={styles.storyCounter}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {stories.length}
        </Text>
      </View>
    </View>
  );
};

export const screenOptions = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  media: {
    width,
    height,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000080',
  },
  progressContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 30 : 50,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
    zIndex: 100,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: '#ffffff33',
    marginHorizontal: 2,
    overflow: 'hidden',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
  leftTapZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '40%',
    zIndex: 50,
  },
  rightTapZone: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '40%',
    zIndex: 50,
  },
  musicIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    zIndex: 10,
  },
  musicText: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  storyCounter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default UserStoryPreview;

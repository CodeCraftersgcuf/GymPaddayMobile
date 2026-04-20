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
  StatusBar,
} from 'react-native';
import { Audio, Video, ResizeMode } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StoryItem } from '@/utils/types/story';
import CachedImage from 'expo-cached-image';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 4000; // Reduced from 5000ms to 4000ms for faster transitions

const fixUrl = (url: string) =>
  url?.replace('https://gympaddy.skillverse.com.pk/storage//', 'https://gympaddy.skillverse.com.pk/storage/');

type StoryWithMusic = StoryItem & {
  music_url?: string | null;
  music_title?: string | null;
};

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

  const currentStory = stories[currentIndex] as StoryWithMusic | undefined;
  const fixedUrl = fixUrl(currentStory?.full_media_url || '');
  const fixedMusicUrl = currentStory?.music_url
    ? fixUrl(String(currentStory.music_url))
    : undefined;

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);
  const [musicSound, setMusicSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const cleanupMedia = async () => {
      // Stop animation
      if (animationRef.current) {
        animationRef.current.stop();
      }
      
      // Reset progress to 0
      progress.setValue(0);
      setIsMediaLoaded(false);

      // Stop and cleanup music
      if (musicSound) {
        try {
          await musicSound.stopAsync();
          await musicSound.unloadAsync();
        } catch (e) {
          // Silently ignore cleanup errors
          if (__DEV__) {
            console.warn('Error cleaning up music:', e);
          }
        }
        setMusicSound(null);
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

  // Start progress animation when media loads
  useEffect(() => {
    if (isMediaLoaded && !isPaused) {
      if (currentStory?.media_type === 'photo') {
        // Reset progress to 0 first
        progress.setValue(0);
        
        // For photos, animate progress bar smoothly
        animationRef.current = Animated.timing(progress, {
          toValue: 1,
          duration: STORY_DURATION,
          useNativeDriver: false,
        });
        animationRef.current.start(({ finished }) => {
          if (finished) handleNext();
        });
      }
      // For videos, progress is updated via onPlaybackStatusUpdate
    }
  }, [isMediaLoaded, isPaused, currentStory?.media_type, currentIndex]);

  const handleNext = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    
    // Reset states
    setIsMediaLoaded(false);
    progress.setValue(0);
    
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.back();
    }
  }, [currentIndex, stories.length, router, progress]);

  const handlePrev = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    
    // Reset states
    setIsMediaLoaded(false);
    progress.setValue(0);
    
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  }, [currentIndex, router, progress]);

  const handlePressIn = () => {
    setIsPaused(true);
    animationRef.current?.stop();
    videoRef.current?.pauseAsync?.();
  };

  const handlePressOut = () => {
    setIsPaused(false);
    if (currentStory?.media_type === 'photo' && isMediaLoaded) {
      // Get current progress value
      const currentProgress = (progress as any)._value || 0;
      const remaining = (1 - currentProgress) * STORY_DURATION;
      
      if (remaining > 0) {
        animationRef.current = Animated.timing(progress, {
          toValue: 1,
          duration: remaining,
          useNativeDriver: false,
        });
        animationRef.current.start(({ finished }) => {
          if (finished) handleNext();
        });
      } else {
        // If no time remaining, go to next
        handleNext();
      }
    } else if (currentStory?.media_type === 'video') {
      // Resume video
      videoRef.current?.playAsync?.();
    }
  };
  const playMusicAfterMediaLoads = useCallback(async () => {
    const musicUri = fixedMusicUrl;
    if (musicUri) {
      try {
        // Stop any existing music first
        if (musicSound) {
          try {
            await musicSound.stopAsync();
            await musicSound.unloadAsync();
          } catch (e) {
            // Ignore cleanup errors
          }
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: musicUri },
          { 
            shouldPlay: true,
            isLooping: true, // Loop music for story
          }
        );
        setMusicSound(sound);
      } catch (err: any) {
        // Only log non-network errors or log silently for network issues
        const errorMessage = err?.message || String(err);
        const isNetworkError = 
          errorMessage.includes('UnknownHostException') ||
          errorMessage.includes('Unable to resolve host') ||
          errorMessage.includes('Network request failed') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('HttpDataSourceException');
        
        // Silently handle network errors (expected when offline or CDN unavailable)
        if (!isNetworkError) {
          // Only log unexpected errors
          if (__DEV__) {
            console.warn('Failed to play music (non-network error):', err);
          }
        }
        // Network errors are expected and don't need logging
      }
    }
  }, [fixedMusicUrl, musicSound]);
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
            cacheKey={`story-${currentStory.id}`}
            style={styles.media}
            resizeMode="contain"
            onLoadStart={() => {
              setIsMediaLoaded(false);
              progress.setValue(0);
            }}
            onLoad={async () => {
              setIsMediaLoaded(true);
              // Small delay to ensure image is fully rendered
              await new Promise(resolve => setTimeout(resolve, 100));
              // Start music after image loads
              if (fixedMusicUrl) {
                await playMusicAfterMediaLoads();
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
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={!isPaused}
          style={styles.media}
          onLoadStart={() => {
            setIsMediaLoaded(false);
            progress.setValue(0);
          }}
          onLoad={async () => {
            setIsMediaLoaded(true);
            if (!isPaused) {
              await videoRef.current?.playAsync?.();
            }
            // Start music after video loads
            if (fixedMusicUrl) {
              await playMusicAfterMediaLoads();
            }
          }}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              // Update progress bar based on video position - smooth animation
              if (status.durationMillis && status.positionMillis !== undefined) {
                const progressValue = Math.min(status.positionMillis / status.durationMillis, 1);
                progress.setValue(progressValue);
              }
              
              if (status.didJustFinish) {
                handleNext();
              } else if (!status.isPlaying && !isPaused && !status.didJustFinish) {
                // Auto-resume if video stopped unexpectedly
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
      {stories.map((_, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        
        return (
          <View key={index} style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                isActive && {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
                isCompleted && {
                  width: '100%',
                  backgroundColor: '#fff',
                },
                !isActive && !isCompleted && {
                  width: '0%',
                  backgroundColor: '#ffffff55',
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
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
      {fixedMusicUrl ? (
        <View style={styles.musicIndicator}>
          <Ionicons name="musical-note" size={16} color="#fff" />
          <Text style={styles.musicText} numberOfLines={1}>
            {currentStory?.music_title || 'Playing music'}
          </Text>
        </View>
      ) : null}

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
    height: height * 0.88,
    backgroundColor: '#000',
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
    top: Platform.OS === 'android' ? 40 : 60,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
    zIndex: 1000,
    elevation: 1000, // For Android
  },
  progressTrack: {
    flex: 1,
    height: 3,
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

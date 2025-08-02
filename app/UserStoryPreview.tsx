import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { Audio, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StoryItem } from '@/utils/types/story';
import CachedImage from 'expo-cached-image';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

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

  const handleNext = () => {
    if (animationRef.current) animationRef.current.stop();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.back();
    }
  };

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
onLoadEnd={async () => {
  setIsMediaLoaded(true);
  if (currentStory?.music_url) {
    await playMusicAfterMediaLoads(); // only after image loaded
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
          onLoad={() => {
            setIsMediaLoaded(true);
            if (!isPaused) {
              videoRef.current?.playAsync?.();
            }
          }}
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
    <Pressable
      onPress={handleNext}
      onLongPress={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.container}>
        {renderMedia()}
        {renderProgressBar()}
      </View>
    </Pressable>
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
});

export default UserStoryPreview;

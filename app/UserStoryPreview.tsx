import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator,
  Pressable,
  Text,
  StatusBar,
  Alert,
} from 'react-native';
import { Audio, Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { StoryItem } from '@/utils/types/story';
import { CachedImage } from '@/components/media/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import {
  prefetchAdjacentStories,
  pickStoryPlaybackUrl,
  getStoryThumbnailUrl,
  resolveStoryMusicPlaybackUrl,
  clearCachedStoryVideo,
} from '@/utils/storyPrefetch';
import { markStoryViewed } from '@/utils/storyViews';
import { deleteStory, removeStoryFromGroupedCache } from '@/utils/storiesApi';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 4000;

const fixUrl = (url: string) =>
  url?.replace('https://api.gympaddy.com/storage//', 'https://api.gympaddy.com/storage/');

type StoryWithMusic = StoryItem & {
  music_url?: string | null;
  music_title?: string | null;
  music?: { url?: string | null } | null;
  musicUrl?: string | null;
};

const resolveStoryMusicUrl = (story?: StoryWithMusic): string | undefined =>
  resolveStoryMusicPlaybackUrl(story);

const isStoryPhoto = (story?: StoryItem) =>
  story?.media_type === 'photo' || (story as any)?.media_type === 'image';

const isStoryVideo = (story?: StoryItem) => story?.media_type === 'video';

function isValidMediaUri(uri?: string | null): uri is string {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('/')
  );
}

type GroupedStoryUser = {
  user?: { id?: number | string };
  stories?: StoryItem[];
};

function resolveStoriesFromParams(
  queryClient: ReturnType<typeof useQueryClient>,
  params: {
    selected?: string | string[];
    userId?: string | string[];
    startIndex?: string | string[];
  },
): StoryItem[] {
  const userIdRaw = params.userId;
  const userId = userIdRaw
    ? String(Array.isArray(userIdRaw) ? userIdRaw[0] : userIdRaw)
    : null;

  let fromSelected: StoryItem[] = [];
  const selectedRaw = params.selected;
  const selectedStr = selectedRaw
    ? (Array.isArray(selectedRaw) ? selectedRaw[0] : selectedRaw)
    : '[]';
  try {
    const parsed = JSON.parse(selectedStr || '[]');
    fromSelected = Array.isArray(parsed) ? parsed : [];
  } catch {
    fromSelected = [];
  }

  let fromCache: StoryItem[] = [];
  if (userId) {
    const grouped = queryClient.getQueryData<GroupedStoryUser[]>(['groupedStories']);
    const group = grouped?.find((g) => String(g.user?.id) === userId);
    if (group?.stories?.length) {
      fromCache = group.stories;
    }
  }

  if (!fromCache.length) return fromSelected;
  if (!fromSelected.length) return fromCache;

  // Merge so we never drop slides when cache/selected disagree after refresh.
  const byId = new Map<number, StoryItem>();
  for (const story of fromSelected) {
    byId.set(Number(story.id), story);
  }
  for (const story of fromCache) {
    const id = Number(story.id);
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, story);
      continue;
    }
    byId.set(id, {
      ...existing,
      ...story,
      music_url: story.music_url || existing.music_url,
      music_title: story.music_title || existing.music_title,
      music_artist: (story as StoryWithMusic).music_artist || (existing as StoryWithMusic).music_artist,
      full_media_url: story.full_media_url || existing.full_media_url,
      full_thumbnail_url: story.full_thumbnail_url || existing.full_thumbnail_url,
    });
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

const UserStoryPreview = () => {
  const params = useLocalSearchParams<{
    selected?: string;
    userId?: string;
    startIndex?: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const resolvedStories = useMemo(
    () => resolveStoriesFromParams(queryClient, params),
    [queryClient, params.selected, params.userId],
  );

  const [stories, setStories] = useState<StoryItem[]>(resolvedStories);
  const [ownUserId, setOwnUserId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setStories(resolvedStories);
  }, [resolvedStories]);

  useEffect(() => {
    SecureStore.getItemAsync('user_data').then((data) => {
      if (!data) return;
      try {
        const parsed = JSON.parse(data);
        if (parsed?.id != null) setOwnUserId(Number(parsed.id));
      } catch {
        /* noop */
      }
    });
  }, []);

  const paramUserId = params.userId ? String(params.userId) : null;

  const isOwnStory = useMemo(() => {
    if (ownUserId == null) return false;
    if (paramUserId && paramUserId === String(ownUserId)) return true;
    return String(stories[0]?.user_id ?? '') === String(ownUserId);
  }, [ownUserId, paramUserId, stories]);

  const initialIndex = useMemo(() => {
    const raw = params.startIndex;
    const n = raw ? parseInt(String(raw), 10) : 0;
    return Number.isFinite(n) && n >= 0 ? Math.min(n, Math.max(0, stories.length - 1)) : 0;
  }, [params.startIndex, stories.length]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isResolvingUrl, setIsResolvingUrl] = useState(true);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const resolveGenRef = useRef(0);

  const progress = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const musicSoundRef = useRef<Audio.Sound | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoPlaybackStartedRef = useRef(false);

  const currentStory = stories[currentIndex] as StoryWithMusic | undefined;
  const fixedMusicUrl = resolveStoryMusicUrl(currentStory);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, params.userId]);

  // Resolve best URL once per slide — cache only if verified, else CDN (no mid-play switch).
  useEffect(() => {
    if (!currentStory) {
      setPlaybackUrl('');
      setThumbnailUrl('');
      setIsResolvingUrl(false);
      return;
    }

    const gen = ++resolveGenRef.current;
    setIsResolvingUrl(true);
    setIsMediaLoaded(false);
    setLoadFailed(false);
    setThumbnailUrl(getStoryThumbnailUrl(currentStory));

    pickStoryPlaybackUrl(currentStory)
      .then((uri) => {
        if (resolveGenRef.current !== gen) return;
        setPlaybackUrl(uri);
        setIsResolvingUrl(false);
      })
      .catch(() => {
        if (resolveGenRef.current !== gen) return;
        const fallback =
          currentStory.full_media_url?.startsWith('http')
            ? fixUrl(currentStory.full_media_url)
            : '';
        setPlaybackUrl(fallback);
        setIsResolvingUrl(false);
      });
  }, [currentIndex, currentStory?.id]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
  }, []);

  const stopMusic = useCallback(async () => {
    const sound = musicSoundRef.current;
    if (!sound) return;
    musicSoundRef.current = null;
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {
      /* noop */
    }
  }, []);

  const startMusic = useCallback(async (musicUri: string, autoPlay = true) => {
    await stopMusic();
    if (isPaused) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: musicUri },
        { shouldPlay: autoPlay, isLooping: true },
      );
      musicSoundRef.current = sound;
    } catch {
      /* best-effort — CDN clip may be missing */
    }
  }, [isPaused, stopMusic]);

  const syncMusicWithVideo = useCallback(async () => {
    if (isPaused || !fixedMusicUrl) return;
    const existing = musicSoundRef.current;
    if (existing) {
      try {
        const status = await existing.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await existing.setPositionAsync(0);
          await existing.playAsync();
        }
      } catch {
        /* noop */
      }
      return;
    }
    await startMusic(fixedMusicUrl, true);
  }, [fixedMusicUrl, isPaused, startMusic]);

  useEffect(() => {
    videoPlaybackStartedRef.current = false;
  }, [currentIndex, currentStory?.id]);

  // Photo stories: music starts when the image is visible.
  useEffect(() => {
    if (!isStoryPhoto(currentStory) || !fixedMusicUrl || isPaused) {
      return;
    }
    if (!isMediaLoaded) return;
    startMusic(fixedMusicUrl, true);
    return () => {
      stopMusic();
    };
  }, [
    currentIndex,
    currentStory?.id,
    fixedMusicUrl,
    isPaused,
    isMediaLoaded,
    currentStory,
    startMusic,
    stopMusic,
  ]);

  // Video stories: preload music once per slide (do NOT depend on isMediaLoaded —
  // that was stopping music right after syncMusicWithVideo started it).
  useEffect(() => {
    if (!isStoryVideo(currentStory) || !fixedMusicUrl || isPaused) {
      return;
    }
    startMusic(fixedMusicUrl, false);
    return () => {
      stopMusic();
    };
  }, [currentIndex, currentStory?.id, fixedMusicUrl, isPaused, currentStory, startMusic, stopMusic]);

  // Video: start music when the first frame is ready.
  useEffect(() => {
    if (!isStoryVideo(currentStory) || !fixedMusicUrl || isPaused || !isMediaLoaded) {
      return;
    }
    syncMusicWithVideo();
  }, [
    isMediaLoaded,
    fixedMusicUrl,
    isPaused,
    currentStory?.id,
    currentStory,
    syncMusicWithVideo,
  ]);

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  const handleNext = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    clearLoadTimeout();
    setIsMediaLoaded(false);
    setLoadFailed(false);
    progress.setValue(0);

    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.back();
    }
  }, [currentIndex, stories.length, router, progress, clearLoadTimeout]);

  const retryCurrentStory = useCallback(() => {
    if (!currentStory) return;
    if (currentStory.id) clearCachedStoryVideo(currentStory.id);
    setLoadFailed(false);
    setIsMediaLoaded(false);
    setIsResolvingUrl(true);
    progress.setValue(0);
    const gen = ++resolveGenRef.current;
    pickStoryPlaybackUrl(currentStory, 0).then((uri) => {
      if (resolveGenRef.current !== gen) return;
      setPlaybackUrl(uri);
      setIsResolvingUrl(false);
    });
  }, [currentStory, progress]);

  const handleVideoError = useCallback(() => {
    clearLoadTimeout();
    setLoadFailed(true);
    setIsMediaLoaded(false);
    animationRef.current?.stop();
    videoRef.current?.pauseAsync?.().catch(() => {});
    musicSoundRef.current?.pauseAsync?.().catch(() => {});
  }, [clearLoadTimeout]);

  useEffect(() => {
    if (currentStory?.id) {
      markStoryViewed(currentStory.id);
    }
  }, [currentStory?.id]);

  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    progress.setValue(0);
    setIsMediaLoaded(false);
    setLoadFailed(false);
    clearLoadTimeout();
  }, [currentIndex, currentStory?.id, clearLoadTimeout]);

  const handlePrev = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    clearLoadTimeout();
    setIsMediaLoaded(false);
    progress.setValue(0);

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  }, [currentIndex, router, progress, clearLoadTimeout]);

  const handleDeleteStory = useCallback(() => {
    if (!currentStory?.id || isDeleting || !isOwnStory) return;

    const storyId = currentStory.id;
    const ownerId = currentStory.user_id ?? paramUserId ?? ownUserId;

    Alert.alert(
      'Delete story?',
      'This story will be removed permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await stopMusic();
              animationRef.current?.stop();
              clearLoadTimeout();

              const token = await SecureStore.getItemAsync('auth_token');
              if (!token) throw new Error('Not authenticated');

              await deleteStory(token, storyId);
              clearCachedStoryVideo(storyId);
              removeStoryFromGroupedCache(queryClient, storyId, ownerId ?? undefined);

              const remaining = stories.filter((s) => s.id !== storyId);
              setStories(remaining);

              if (remaining.length === 0) {
                Toast.show({ type: 'success', text1: 'Story deleted' });
                router.replace('/(tabs)');
                return;
              }

              if (currentIndex >= remaining.length) {
                setCurrentIndex(remaining.length - 1);
              }

              Toast.show({ type: 'success', text1: 'Story deleted' });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Delete failed',
                text2: error?.message || 'Please try again.',
              });
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }, [
    currentStory,
    isDeleting,
    isOwnStory,
    paramUserId,
    ownUserId,
    stories,
    currentIndex,
    queryClient,
    router,
    stopMusic,
    clearLoadTimeout,
  ]);

  useEffect(() => {
    if (isMediaLoaded && !isPaused) {
      if (isStoryPhoto(currentStory)) {
        progress.setValue(0);
        animationRef.current = Animated.timing(progress, {
          toValue: 1,
          duration: STORY_DURATION,
          useNativeDriver: false,
        });
        animationRef.current.start(({ finished }) => {
          if (finished) handleNext();
        });
      }
    }
  }, [isMediaLoaded, isPaused, currentStory?.media_type, currentIndex, handleNext, progress]);

  const handlePressIn = () => {
    setIsPaused(true);
    animationRef.current?.stop();
    videoRef.current?.pauseAsync?.();
    musicSoundRef.current?.pauseAsync?.();
  };

  const handlePressOut = () => {
    setIsPaused(false);
    if (isStoryPhoto(currentStory) && isMediaLoaded) {
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
        handleNext();
      }
    } else if (isStoryVideo(currentStory)) {
      videoRef.current?.playAsync?.();
      if (fixedMusicUrl) {
        syncMusicWithVideo();
      }
    } else if (fixedMusicUrl) {
      musicSoundRef.current?.playAsync?.();
    }
  };

  const onMediaLoaded = useCallback(() => {
    clearLoadTimeout();
    setIsMediaLoaded(true);
  }, [clearLoadTimeout]);

  useEffect(() => {
    const preloadStories = async () => {
      prefetchAdjacentStories(stories, currentIndex);

      const nextStory = stories[currentIndex + 1];
      if (nextStory) {
        const thumb = getStoryThumbnailUrl(nextStory);
        if (thumb) Image.prefetch(thumb).catch(() => {});
      }
    };
    preloadStories();
  }, [currentIndex, stories]);

  useEffect(() => {
    return () => {
      clearLoadTimeout();
      stopMusic();
    };
  }, [clearLoadTimeout, stopMusic]);

  const renderMedia = () => {
    if (!currentStory) return null;
    const mediaKey = `story-media-${currentStory.id}`;
    const showSpinner = isResolvingUrl || (!isMediaLoaded && !loadFailed);
    const poster = thumbnailUrl || playbackUrl;

    if (loadFailed) {
      return (
        <View style={styles.errorWrap}>
          {poster ? (
            <CachedImage
              uri={poster}
              resolve={false}
              style={styles.media}
              contentFit="contain"
            />
          ) : null}
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>Couldn&apos;t load this story</Text>
            <Pressable style={styles.retryBtn} onPress={retryCurrentStory}>
              <Text style={styles.retryBtnText}>Tap to retry</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (isStoryPhoto(currentStory)) {
      if (!isValidMediaUri(playbackUrl) && isResolvingUrl) {
        return (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        );
      }
      return (
        <>
          {isValidMediaUri(playbackUrl) ? (
            <CachedImage
              key={mediaKey}
              uri={playbackUrl}
              resolve={false}
              recyclingKey={mediaKey}
              style={styles.media}
              contentFit="contain"
              priority="high"
              onLoad={onMediaLoaded}
              onError={handleVideoError}
            />
          ) : null}
          {showSpinner && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </>
      );
    }

    if (!isValidMediaUri(playbackUrl)) {
      return (
        <View style={styles.loader}>
          {poster ? (
            <CachedImage
              uri={poster}
              resolve={false}
              style={styles.media}
              contentFit="contain"
            />
          ) : null}
          <ActivityIndicator size="large" color="#fff" />
        </View>
      );
    }

    return (
      <>
        {poster && !isMediaLoaded ? (
          <CachedImage
            uri={poster}
            resolve={false}
            recyclingKey={`${mediaKey}-poster`}
            style={styles.media}
            contentFit="contain"
            priority="high"
          />
        ) : null}
        <Video
          key={mediaKey}
          ref={(ref) => {
            videoRef.current = ref;
          }}
          source={{ uri: playbackUrl }}
          rate={1.0}
          volume={1.0}
          isMuted={!!fixedMusicUrl}
          isLooping={false}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={!isPaused && !isResolvingUrl}
          progressUpdateIntervalMillis={150}
          style={styles.media}
          onLoad={onMediaLoaded}
          onReadyForDisplay={onMediaLoaded}
          onError={handleVideoError}
          onPlaybackStatusUpdate={(status) => {
            if (!status.isLoaded) return;
            if (
              fixedMusicUrl &&
              !videoPlaybackStartedRef.current &&
              (status.isPlaying || (status.positionMillis ?? 0) > 0)
            ) {
              videoPlaybackStartedRef.current = true;
              syncMusicWithVideo();
            }
            if (status.isPlaying && (status.positionMillis ?? 0) > 0) {
              onMediaLoaded();
            }
            if (status.durationMillis && status.positionMillis !== undefined) {
              const progressValue = Math.min(
                status.positionMillis / status.durationMillis,
                1,
              );
              progress.setValue(progressValue);
            }
            if (status.didJustFinish) {
              handleNext();
            } else if (!status.isPlaying && !isPaused && !status.didJustFinish) {
              videoRef.current?.playAsync?.();
            }
          }}
        />
        {showSpinner && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </>
    );
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {stories.map((story, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <View key={story.id ?? index} style={styles.progressTrack}>
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

  if (!stories.length) {
    return (
      <View style={[styles.container, styles.empty]}>
        <Text style={styles.emptyText}>No stories available</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.emptyLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {renderMedia()}
      {renderProgressBar()}

      <Pressable
        style={styles.leftTapZone}
        onPress={handlePrev}
        onLongPress={handlePressIn}
        onPressOut={handlePressOut}
      />

      <Pressable
        style={styles.rightTapZone}
        onPress={handleNext}
        onLongPress={handlePressIn}
        onPressOut={handlePressOut}
      />

      {/* Above tap zones (zIndex 50) so close/delete receive touches, not prev/next */}
      <View style={styles.headerTouchShield} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.topBarBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {isOwnStory ? (
            <Pressable
              onPress={handleDeleteStory}
              hitSlop={12}
              style={styles.topBarBtn}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="trash-outline" size={24} color="#fff" />
              )}
            </Pressable>
          ) : (
            <View style={styles.topBarBtn} />
          )}
        </View>
      </View>

      {fixedMusicUrl ? (
        <View style={styles.musicIndicator}>
          <Ionicons name="musical-note" size={16} color="#fff" />
          <Text style={styles.musicText} numberOfLines={1}>
            {currentStory?.music_title || 'Playing music'}
          </Text>
        </View>
      ) : null}

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
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  emptyLink: {
    color: '#C61F3A',
    fontSize: 15,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    width: '100%',
  },
  headerTouchShield: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 108 : 92,
    zIndex: 200,
    elevation: 200,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#00000040',
  },
  errorWrap: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    gap: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#C61F3A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  progressContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 60,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
    zIndex: 1000,
    elevation: 1000,
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
    top: Platform.OS === 'ios' ? 108 : 92,
    left: 0,
    bottom: 0,
    width: '40%',
    zIndex: 50,
  },
  rightTapZone: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 108 : 92,
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

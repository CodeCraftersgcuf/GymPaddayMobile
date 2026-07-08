import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Pressable,
  StatusBar,
  type ViewToken,
} from 'react-native';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { images } from '@/constants';
import type { FeedPostVideo } from '@/contexts/FeedVideoPoolContext';
import { prefetchFeedVideosFromIndex, REELS_PREFETCH_AHEAD } from '@/utils/videoPrefetch';
import { downloadMedia } from '@/utils/downloadMedia';
import ReelsActionRail from '@/components/Social/reels/ReelsActionRail';
import ReelsMoreSheet from '@/components/Social/reels/ReelsMoreSheet';
import PostCommentsSheet from '@/components/Social/PostCommentsSheet';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type ReelsVideoCellProps = {
  post: FeedPostVideo;
  isActive: boolean;
  shouldLoad: boolean;
  isMuted: boolean;
  pageHeight: number;
};

const ReelsVideoCell = React.memo(function ReelsVideoCell({
  post,
  isActive,
  shouldLoad,
  isMuted,
  pageHeight,
}: ReelsVideoCellProps) {
  const videoRef = useRef<Video | null>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [sourceUrl, setSourceUrl] = useState(post.videoUrl ?? null);

  useEffect(() => {
    setSourceUrl(post.videoUrl ?? null);
    setReady(false);
    setPaused(false);
  }, [post.id, post.videoUrl]);

  // Reset manual pause when the cell leaves the active slot, so re-entering plays.
  useEffect(() => {
    if (!isActive) setPaused(false);
  }, [isActive]);

  // Load the source declaratively for the active cell AND its neighbors so the
  // next/prev reel is already buffered in the player — scrolling plays instantly
  // instead of cold-loading every time.
  const load = isActive || shouldLoad;
  const shouldPlay = isActive && !paused;

  const togglePlayPause = useCallback(() => {
    if (!isActive) return;
    setPaused((prev) => !prev);
  }, [isActive]);

  const onStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsBuffering(Boolean(status.isBuffering));
    // onReadyForDisplay can fire late (Android/HLS), leaving the poster on top
    // while audio already plays. Once playback advances, frames are rendering —
    // drop the poster immediately.
    if (status.isPlaying && (status.positionMillis ?? 0) > 0) {
      setReady((prev) => (prev ? prev : true));
    }
  }, []);

  return (
    <Pressable style={[styles.page, { height: pageHeight }]} onPress={togglePlayPause}>
      {post.videoThumbnailUrl && !ready ? (
        <ExpoImage
          source={{ uri: post.videoThumbnailUrl }}
          style={styles.poster}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      ) : null}

      <Video
        ref={videoRef}
        style={[styles.video, { height: pageHeight }]}
        source={load && sourceUrl ? { uri: sourceUrl } : undefined}
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        isMuted={isMuted}
        shouldPlay={shouldPlay}
        useNativeControls={false}
        progressUpdateIntervalMillis={150}
        onReadyForDisplay={() => setReady(true)}
        onPlaybackStatusUpdate={onStatus}
        onError={() => {
          if (post.videoMp4Url && sourceUrl !== post.videoMp4Url) {
            setSourceUrl(post.videoMp4Url);
          }
        }}
      />

      {isActive && isBuffering && !ready && (
        <ActivityIndicator size="large" color="#fff" style={styles.spinner} />
      )}

      {isActive && paused && ready && (
        <View style={styles.playHint} pointerEvents="none">
          <Image source={images.playIcon} style={styles.playIcon} />
        </View>
      )}
    </Pressable>
  );
});

export type FeedReelsViewerProps = {
  visible: boolean;
  videoPosts: FeedPostVideo[];
  initialPostId: number | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onClose: () => void;
  onActivePostChange?: (postId: number) => void;
  onLoadMore?: () => void;
  onHidePost?: (postId: number) => void;
};

export default function FeedReelsViewer({
  visible,
  videoPosts,
  initialPostId,
  isMuted,
  onToggleMute,
  onClose,
  onActivePostChange,
  onLoadMore,
  onHidePost,
}: FeedReelsViewerProps) {
  const listRef = useRef<FlatList<FeedPostVideo>>(null);
  const [pageHeight, setPageHeight] = useState(SCREEN_H);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const hasScrolledToInitial = useRef(false);
  const loadMoreAtLengthRef = useRef(0);

  const [commentsPostId, setCommentsPostId] = useState<number | null>(null);
  const [morePost, setMorePost] = useState<FeedPostVideo | null>(null);
  const [commentCountOverrides, setCommentCountOverrides] = useState<Record<number, number>>({});

  const activePost = videoPosts[activeIndex] ?? null;

  const openComments = useCallback((postId: number) => setCommentsPostId(postId), []);
  const closeComments = useCallback(() => setCommentsPostId(null), []);
  const openMore = useCallback((post: FeedPostVideo) => setMorePost(post), []);
  const closeMore = useCallback(() => setMorePost(null), []);

  const handleDownload = useCallback((post: FeedPostVideo) => {
    downloadMedia(post.videoMp4Url || post.videoUrl);
  }, []);

  const handleHide = useCallback(
    (postId: number) => {
      onHidePost?.(postId);
    },
    [onHidePost],
  );

  const handleCommentAdded = useCallback((postId: number) => {
    setCommentCountOverrides((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? videoPosts.find((p) => p.id === postId)?.comments_count ?? 0) + 1,
    }));
  }, [videoPosts]);

  const initialIndex = useMemo(() => {
    if (initialPostId == null || !videoPosts.length) return 0;
    const idx = videoPosts.findIndex((p) => Number(p.id) === Number(initialPostId));
    return idx >= 0 ? idx : 0;
  }, [initialPostId, videoPosts]);

  useEffect(() => {
    if (!visible) {
      hasScrolledToInitial.current = false;
      loadMoreAtLengthRef.current = 0;
      return;
    }
    setActiveIndex(initialIndex);
    activeIndexRef.current = initialIndex;
    prefetchFeedVideosFromIndex(videoPosts, initialIndex, REELS_PREFETCH_AHEAD);
  }, [visible, initialIndex, videoPosts]);

  useEffect(() => {
    if (!visible || hasScrolledToInitial.current || !videoPosts.length) return;

    const scrollToInitial = () => {
      try {
        listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
        hasScrolledToInitial.current = true;
      } catch {
        listRef.current?.scrollToOffset({ offset: initialIndex * pageHeight, animated: false });
        hasScrolledToInitial.current = true;
      }
    };

    requestAnimationFrame(scrollToInitial);
  }, [visible, initialIndex, videoPosts.length, pageHeight]);

  useEffect(() => {
    if (!visible) return;
    prefetchFeedVideosFromIndex(videoPosts, activeIndex, REELS_PREFETCH_AHEAD);
    const post = videoPosts[activeIndex];
    if (post?.id != null) {
      onActivePostChange?.(post.id);
    }
    if (onLoadMore && activeIndex >= videoPosts.length - 3) {
      if (loadMoreAtLengthRef.current < videoPosts.length) {
        loadMoreAtLengthRef.current = videoPosts.length;
        onLoadMore();
      }
    }
  }, [visible, activeIndex, videoPosts, onActivePostChange, onLoadMore]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const primary = viewableItems.find((v) => v.isViewable && v.index != null);
      if (primary?.index == null) return;
      if (primary.index === activeIndexRef.current) return;
      activeIndexRef.current = primary.index;
      setActiveIndex(primary.index);
    },
    [],
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 85,
    minimumViewTime: 80,
  }).current;

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]).current;

  const renderItem = useCallback(
    ({ item, index }: { item: FeedPostVideo; index: number }) => (
      <ReelsVideoCell
        post={item}
        isActive={index === activeIndex}
        shouldLoad={Math.abs(index - activeIndex) <= 1}
        isMuted={isMuted}
        pageHeight={pageHeight}
      />
    ),
    [activeIndex, isMuted, pageHeight],
  );

  const keyExtractor = useCallback((item: FeedPostVideo) => String(item.id), []);

  const getItemLayout = useCallback(
    (_: ArrayLike<FeedPostVideo> | null | undefined, index: number) => ({
      length: pageHeight,
      offset: pageHeight * index,
      index,
    }),
    [pageHeight],
  );

  if (!visible || !videoPosts.length) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView
        style={styles.root}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - pageHeight) > 1) {
            setPageHeight(h);
          }
        }}
      >
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <Ionicons name="chevron-down" size={30} color="#fff" />
        </TouchableOpacity>

        <FlatList
          ref={listRef}
          data={videoPosts}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={pageHeight}
          snapToAlignment="start"
          disableIntervalMomentum
          getItemLayout={getItemLayout}
          initialScrollIndex={initialIndex > 0 ? initialIndex : undefined}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: false,
            });
          }}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
          windowSize={7}
          maxToRenderPerBatch={3}
          initialNumToRender={3}
          removeClippedSubviews={false}
          extraData={`${activeIndex}-${isMuted}`}
        />

        {activePost && (
          <>
            {(activePost.user?.username || activePost.content) && (
              <View style={styles.caption} pointerEvents="box-none">
                {activePost.user?.username ? (
                  <Text style={styles.captionUser} numberOfLines={1}>
                    @{activePost.user.username}
                  </Text>
                ) : null}
                {activePost.content ? (
                  <Text style={styles.captionText} numberOfLines={2}>
                    {activePost.content}
                  </Text>
                ) : null}
              </View>
            )}

            <ReelsActionRail
              post={activePost}
              onOpenComments={openComments}
              onOpenMore={openMore}
              commentsCount={commentCountOverrides[activePost.id] ?? activePost.comments_count}
            />
          </>
        )}

        <TouchableOpacity style={styles.muteBtn} onPress={onToggleMute} hitSlop={10}>
          <Image
            source={isMuted ? images.mute : images.unmute}
            style={styles.muteIcon}
          />
        </TouchableOpacity>

        <PostCommentsSheet
          visible={commentsPostId != null}
          postId={commentsPostId}
          onClose={closeComments}
          onCommentAdded={handleCommentAdded}
        />

        <ReelsMoreSheet
          visible={morePost != null}
          post={morePost}
          onClose={closeMore}
          onDownload={handleDownload}
          onHide={handleHide}
          onNotInterested={handleHide}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 30,
    padding: 8,
  },
  page: {
    width: SCREEN_W,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: SCREEN_W,
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
  },
  spinner: {
    position: 'absolute',
  },
  playHint: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 36,
    padding: 16,
  },
  playIcon: {
    width: 36,
    height: 36,
    tintColor: '#fff',
  },
  caption: {
    position: 'absolute',
    left: 14,
    right: 80,
    bottom: 48,
    zIndex: 20,
  },
  captionUser: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
  },
  captionText: {
    color: '#fff',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
  },
  muteBtn: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 24,
    padding: 10,
    zIndex: 30,
  },
  muteIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff',
  },
});

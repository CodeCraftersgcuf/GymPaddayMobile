import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ViewToken,
  AppState,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import StoryContainer from '@/components/Social/StoryContainer';
import PostItem from '@/components/Social/PostItem';
import CommentsBottomSheet from '@/components/Social/CommentsBottomSheet';
import { mockStories, mockPosts } from '@/components/Social/mockData';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabHeader from '@/components/Social/TabHeader';
import FloatingActionButton from '@/components/Social/FloatingActionButton';
import { useTheme } from '@/contexts/themeContext';
import PostDetailBottomsheet from '@/components/Social/PostDetailBottomsheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';

import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { getUserPosts } from '@/utils/queries/posts';
import * as SecureStore from 'expo-secure-store';
import { getPostComments } from '@/utils/queries/comments';
import { createComment } from '@/utils/mutations/comments';
import { fetchGroupedStories } from '@/utils/storiesApi';
import { mapPostFromApi } from '@/utils/mapFeedPost';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { STALE_TIMES } from '@/utils/queryClient';
import { getFeedScrollState } from '@/utils/sessionPersistence';
import { useFeedSession } from '@/contexts/FeedSessionContext';
import { useSilentInfiniteScroll } from '@/utils/useSilentInfiniteScroll';
import { getNextFeedPage } from '@/utils/feedPagination';
import { seedPostCaches } from '@/utils/postCache';
import { prefetchFeedVideos, prefetchFeedVideosFromIndex, getFeedPrefetchAhead } from '@/utils/videoPrefetch';
import { setActiveFeedPostId } from '@/utils/feedVideoCache';
import { prefetchGroupedStories } from '@/utils/storyPrefetch';
import { sortGroupedStoriesUnseenFirst } from '@/utils/storyViews';
import { prefetchProfilesForFeedPosts, warmFeedImagesFromCache } from '@/utils/mediaWarm';
import { FeedVideoPoolProvider, FeedVideoLayout } from '@/contexts/FeedVideoPoolContext';
import FeedVideoOverlay from '@/components/Social/FeedVideoOverlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { CachedImage } from '@/components/media/CachedImage';
import {
  getPendingPosts,
  subscribePendingPosts,
  resumePendingPostPolling,
  type PendingPost,
} from '@/utils/pendingPosts';

// LoadingIndicator component
function LoadingIndicator({ text = "Loading..." }) {
  const { dark } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: dark ? '#000' : '#fff' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ActivityIndicator size="large" color="#940304" />
      <Text style={{ color: dark ? '#fff' : '#000', fontSize: 18, marginTop: 16 }}>{text}</Text>
    </View>
  );
}

export default function SocialFeedScreen() {
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentComments, setCurrentComments] = useState<any[]>([]);
  const [optimisticComments, setOptimisticComments] = useState<any[]>([]);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const [idCan, setidCan] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const { dark } = useTheme();
  const route = useRouter();
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([]);
  const logoutTriggeredRef = useRef(false);
  const flatListRef = useRef<FlatList<any>>(null);
  const scrollOffsetRef = useRef(0);
  const scrollRestoredRef = useRef(false);
  const savedActivePostRef = useRef<number | null>(null);
  const activePostIdRef = useRef<number | null>(null);
  const { registerFeedScroll, registerActivePostId } = useFeedSession();
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  // Reels (fullscreen video detail) open state is owned here so we can fully
  // pause the feed while the user is inside Reels — no video plays behind it.
  const [reelsPostId, setReelsPostId] = useState<number | null>(null);
  const openVideoDetail = useCallback((postId: number) => setReelsPostId(postId), []);
  const closeVideoDetail = useCallback(() => setReelsPostId(null), []);
  const feedActive = isFocused && appActive;
  const reelsOpen = reelsPostId != null;
  const playbackEnabled = feedActive && !reelsOpen;
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);

  const refreshPendingPosts = useCallback(async () => {
    const items = await getPendingPosts();
    setPendingPosts(items);
  }, []);

  useEffect(() => {
    refreshPendingPosts();
    return subscribePendingPosts(() => {
      refreshPendingPosts();
    });
  }, [refreshPendingPosts]);

  useFocusEffect(
    useCallback(() => {
      refreshPendingPosts();
      resumePendingPostPolling(
        () => refreshPendingPosts(),
        () => refreshPendingPosts(),
      ).catch(() => {});
    }, [refreshPendingPosts]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  const handleBlockedOrUnauthorized = async (incomingError: any) => {
    if (logoutTriggeredRef.current) return;

    const statusCode = incomingError?.statusCode;
    const errorCode = incomingError?.errorCode || incomingError?.data?.error?.code;
    const errorMessage = incomingError?.message || incomingError?.data?.error?.message;
    const isBlockedError = errorCode === 'ACCOUNT_BANNED' || /banned/i.test(errorMessage || '');
    const isAuthError = statusCode === 401 || statusCode === 403 || isBlockedError;

    if (!isAuthError) return;

    logoutTriggeredRef.current = true;

    try {
      await Promise.all([
        SecureStore.deleteItemAsync('auth_token'),
        SecureStore.deleteItemAsync('user_data'),
        SecureStore.deleteItemAsync('user_id'),
        SecureStore.deleteItemAsync('username'),
      ]);
    } catch (storageError) {
      console.error('Failed to clear auth data after blocked/expired session:', storageError);
    }

    Alert.alert(
      isBlockedError ? 'Account Blocked' : 'Session Expired',
      isBlockedError
        ? (errorMessage || 'Your account has been blocked. Please contact support.')
        : 'Your session has expired. Please login again.',
      [{ text: 'OK', onPress: () => route.replace('/login') }],
      { cancelable: false }
    );
  };

  // const { data, isLoading, refetch } = useQuery({
  //   queryKey: ['userPosts'],
  //   queryFn: async () => {
  //     const token = await SecureStore.getItemAsync('auth_token');
  //     if (!token) throw new Error('No auth token found');
  //     const response = await getUserPosts(token);
  //     return response;
  //   },
  // });
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    error,
    isError,
  } = useInfiniteQuery({
    queryKey: ['userPosts'],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');
      return getUserPosts(token, pageParam);
    },
    initialPageParam: 1,
    placeholderData: (previousData) => previousData,
    getNextPageParam: getNextFeedPage,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors (401, 403)
      if (error?.statusCode === 401 || error?.statusCode === 403) {
        return false;
      }
      // Retry up to 3 times for network errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * 2 ** attemptIndex, 4000);
    },
    staleTime: STALE_TIMES.feed,
    gcTime: 24 * 60 * 60 * 1000,
  });

  useEffect(() => {
    if (isError && error) {
      handleBlockedOrUnauthorized(error);
    }
  }, [isError, error]);


  const {
    data: groupedStories = [],
    refetch: refetchStories,
    isFetching: isFetchingStories,
  } = useQuery({
    queryKey: ['groupedStories'],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');
      return fetchGroupedStories(token);
    },
    placeholderData: (previousData) => previousData,
    staleTime: STALE_TIMES.stories,
    gcTime: 24 * 60 * 60 * 1000,
  });

  useEffect(() => {
    if (groupedStories?.length) {
      prefetchGroupedStories(groupedStories);
    }
  }, [groupedStories]);

  const sortedGroupedStories = useMemo(
    () => sortGroupedStoriesUnseenFirst(groupedStories ?? []),
    [groupedStories],
  );

  const getToken = async () => {
    return await SecureStore.getItemAsync('auth_token');
  };
  const {
    data: commentData,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['postComments', currentPostId],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');

      if (!token || !currentPostId) throw new Error('No token or postId');
      return getPostComments(token, currentPostId);
    },
    enabled: !!currentPostId && commentModalVisible,
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });
  // console.log("The Comments Data:", commentData);
  const {
    mutate: addComment,
    isPending: isAddingComment,
    error: addCommentError
  } = useMutation({
    mutationFn: async ({ text, postId, tempId, parentId }) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error("No token");
      return createComment({
        data: { post_id: postId, content: text, parent_id: parentId },
        token
      });
    },
    onSuccess: async (res, variables) => {
      // Don't remove optimistic comment or refetch - just log success
      console.log('Comment added successfully to backend');
      // The optimistic comment will remain in the UI
    },
    onError: (error, variables) => {
      // Only remove the optimistically added comment from UI on error
      console.error('Error adding comment, removing from UI:', error);
      setOptimisticComments(prev =>
        prev.filter(comment => comment.id !== variables.tempId)
      );
    }
  });

  const handleAddComment = useCallback(async (text: string, postId: number, parentId?: string) => {
    // Get current user data for optimistic comment
    const getCurrentUser = async () => {
      try {
        const userData = await SecureStore.getItemAsync('user_data');
        return userData ? JSON.parse(userData) : null;
      } catch {
        return null;
      }
    };

    const user = await getCurrentUser();

    // Create temporary comment for immediate UI update
    const tempComment = {
      id: `temp_${Date.now()}`,
      userId: user?.id?.toString() || 'current_user',
      username: user?.username || 'You',
      profileImage: user?.profile_picture_url || '',
      text: text,
      timestamp: new Date().toISOString(),
      likes: 0,
      replies: [],
      parentId: parentId || null

    };
    setOptimisticComments(prev => {
      const updated = JSON.parse(JSON.stringify(prev)); // deep clone since it's nested

      if (parentId) {
        // Insert into the correct parent's replies
        const insertReply = (comments: any[]) => {
          for (let comment of comments) {
            if (comment.id == parentId) {
              comment.replies = [...(comment.replies || []), tempComment];
              return true;
            }
            if (comment.replies?.length) {
              const found = insertReply(comment.replies);
              if (found) return true;
            }
          }
          return false;
        };

        const found = insertReply(updated);

        if (!found) {
          console.warn("Parent not found in optimistic comments");
          return [...updated, tempComment]; // fallback to top level
        }

        return updated;
      }

      // No parentId means it's a top-level comment
      return [...updated, tempComment];
    });

    // Send to backend
    addComment({ text, postId, tempId: tempComment.id, parentId });
  }, [addComment]);

  const handleCommentPress = useCallback((comments: any[], postId: number) => {
    setCurrentPostId(postId);
    setCommentModalVisible(true);
    // Clear any existing optimistic comments when opening new comment modal.
    // Cached comments (from a prior open or feed seed) render instantly;
    // react-query revalidates in the background instead of forcing a blank refetch.
    setOptimisticComments([]);
  }, []);

  const handleCloseComments = useCallback(() => {
    setCommentModalVisible(false);
    setCurrentPostId(null);
    // Clear optimistic comments when closing modal
    setOptimisticComments([]);
  }, []);

  useEffect(() => {
    activePostIdRef.current = activePostId;
  }, [activePostId]);

  useEffect(() => {
    registerFeedScroll(() => scrollOffsetRef.current);
    registerActivePostId(() => activePostIdRef.current);
  }, [registerFeedScroll, registerActivePostId]);

  const posts = useMemo(() => {
    if (!data?.pages) return [];
    const allPosts = data.pages.flatMap((page) => page.data || []);
    const formatted = allPosts
      .map(mapPostFromApi)
      .filter((post: any) => post.publish_status !== 'processing');
    const hiddenIdsSet = new Set(hiddenPostIds.map((id) => Number(id)));
    return formatted.filter((post: any) => !hiddenIdsSet.has(Number(post.id)));
  }, [data, hiddenPostIds]);

  const feedData = useMemo(() => {
    const publishedIds = new Set(posts.map((p: any) => Number(p.id)));
    const placeholders = pendingPosts
      .filter((p) => !publishedIds.has(p.postId))
      .map((p) => ({
        id: `pending-${p.postId}`,
        isPending: true,
        pendingPostId: p.postId,
        caption: p.caption,
        thumbnailUri: p.thumbnailUri,
        user: posts[0]?.user ?? { username: 'You', profile_picture: '' },
        content: p.caption || 'Processing your post…',
        likes_count: 0,
        comments_count: 0,
        share_count: 0,
        imagesUrl: p.thumbnailUri ? [p.thumbnailUri] : [],
      }));
    return [...placeholders, ...posts];
  }, [posts, pendingPosts]);

  useEffect(() => {
    if (!data?.pages?.length) return;
    const rawPosts = data.pages.flatMap((page) => page?.data ?? []);
    seedPostCaches(rawPosts);
    warmFeedImagesFromCache(2);
    prefetchProfilesForFeedPosts(rawPosts.slice(0, 20), 10);
  }, [data?.pages]);

  useEffect(() => {
    prefetchFeedVideos(posts, activePostId, getFeedPrefetchAhead());
  }, [posts, activePostId]);

  useEffect(() => {
    setActiveFeedPostId(activePostId);
  }, [activePostId]);

  const handleReelsLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleReelsActivePostChange = useCallback((postId: number) => {
    setActivePostId(postId);
  }, []);

  const { loadMore, onPrefetchViewableItemsChanged, prefetchViewabilityConfig } =
    useSilentInfiniteScroll({
      itemCount: posts.length,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
      thresholdFromEnd: 8,
      bootstrapPages: 2,
      loadedPageCount: data?.pages?.length ?? 0,
      chainPrefetch: true,
      autoPrefetchSecondPage: false,
      firstPageReady: Boolean(data?.pages?.[0]?.data?.length),
    });

  useEffect(() => {
    if (posts.length === 0) return;
    setActivePostId((prev) => {
      const saved = savedActivePostRef.current;
      if (saved != null && posts.some((p: any) => p.id === saved)) {
        savedActivePostRef.current = null;
        return saved;
      }
      if (prev != null && posts.some((p: any) => p.id === prev)) {
        return prev;
      }
      return posts[0].id;
    });
  }, [posts]);

  useEffect(() => {
    if (posts.length === 0 || scrollRestoredRef.current) return;

    (async () => {
      const { offset, activePostId: savedPostId } = await getFeedScrollState();
      if (savedPostId != null && !Number.isNaN(savedPostId)) {
        savedActivePostRef.current = savedPostId;
        setActivePostId(savedPostId);
      }
      if (offset > 0) {
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToOffset({ offset, animated: false });
          scrollRestoredRef.current = true;
        });
      } else {
        scrollRestoredRef.current = true;
      }
    })();
  }, [posts.length]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visible = viewableItems
        .filter((entry) => entry.isViewable && entry.item?.id != null && !entry.item?.isPending)
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

      if (visible.length === 0) {
        setActivePostId(null);
        return;
      }

      const center = visible[Math.floor(visible.length / 2)];
      const nextId = Number(center.item.id);
      setActivePostId((prev) => (prev === nextId ? prev : nextId));

      const maxIndex = Math.max(...visible.map((entry) => entry.index ?? 0));
      prefetchFeedVideosFromIndex(posts, maxIndex, getFeedPrefetchAhead());
    },
    [posts],
  );

  const onViewableItemsChangedRef = useRef(onViewableItemsChanged);
  useEffect(() => {
    onViewableItemsChangedRef.current = onViewableItemsChanged;
  }, [onViewableItemsChanged]);

  const stableOnViewableItemsChanged = useRef(
    (info: { viewableItems: ViewToken[] }) => {
      onViewableItemsChangedRef.current(info);
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 120,
  }).current;

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged: stableOnViewableItemsChanged },
    {
      viewabilityConfig: prefetchViewabilityConfig,
      onViewableItemsChanged: onPrefetchViewableItemsChanged,
    },
  ]).current;



  const handleStartLive = () => {
    route.push('/goLive');
  };

  const handleCreatePost = () => {
    route.push('/createpost');
  };

  const [BottomIndex, setBottomIndex] = useState(-1);
  const [PostType, setPostType] = useState('ViewerPost');

  useEffect(() => {
    const loadHiddenPosts = async () => {
      try {
        const stored = await AsyncStorage.getItem('hidden_post_ids');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Ensure all IDs are numbers
            const numericIds = parsed.map(id => Number(id)).filter(id => !isNaN(id));
            console.log('📦 Loaded hidden post IDs from storage:', numericIds.length, 'posts');
            setHiddenPostIds(numericIds);
          } else {
            console.warn('⚠️ Stored hidden posts is not an array:', parsed);
            setHiddenPostIds([]);
          }
        } else {
          console.log('ℹ️ No hidden posts found in storage');
          setHiddenPostIds([]);
        }
      } catch (err) {
        console.error('❌ Failed to load hidden posts:', err);
        setHiddenPostIds([]);
      }
    };
    loadHiddenPosts();
  }, []);

  const handleMenu = useCallback((userId: any, postId: any) => {
    setPostType(userId == 100 ? 'userpost' : 'ViewerPost');
    setBottomIndex(1);
    setidCan({ userId, postId });
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);

    // Refresh posts
    await refetch();
    await refetchStories();

    setRefreshing(false);
  }, [refetch, refetchStories]);

  const showFeedSkeleton = isLoading && posts.length === 0 && !data?.pages?.length;

  const hidePostById = useCallback((postId: number) => {
    const postIdToHide = Number(postId);
    if (Number.isNaN(postIdToHide)) return;

    setHiddenPostIds((prev) => {
      if (prev.includes(postIdToHide)) return prev;
      const updated = [...prev, postIdToHide];
      AsyncStorage.setItem('hidden_post_ids', JSON.stringify(updated)).catch((err) => {
        console.error('❌ Failed to persist hidden posts:', err);
      });
      return updated;
    });
  }, []);

  const handleHidePost = async () => {
    if (idCan && 'postId' in idCan && idCan.postId) {
      hidePostById(Number(idCan.postId));
      // Close the bottom sheet
      setBottomIndex(-1);
    } else {
      console.warn('⚠️ No postId found in idCan:', idCan);
    }
  };
  const mapApiCommentsToInternal = useCallback((apiComments: any[]): Comment[] => {
    return (apiComments || []).map((item) => ({
      id: item.id.toString(),
      userId: item.user?.id?.toString() || '',
      username: item.user?.username || 'Unknown',
      profileImage: resolveMediaUrl(item.user?.profile_picture_url) || '',
      text: item.content || '',
      timestamp: item.created_at,
      likes: 0,
      replies: mapApiCommentsToInternal(item.replies || [])
    }));
  }, []);

  const sheetComments = useMemo(
    () => [...mapApiCommentsToInternal(commentData || []), ...optimisticComments],
    [commentData, optimisticComments, mapApiCommentsToInternal]
  );

  const activeIndex = useMemo(
    () => (activePostId != null ? feedData.findIndex((p: any) => p.id === activePostId) : -1),
    [feedData, activePostId],
  );

  const renderPendingPost = useCallback(
    (item: any) => (
      <View style={[styles.pendingCard, { backgroundColor: dark ? '#111' : '#f5f5f5' }]}>
        {item.thumbnailUri ? (
          <CachedImage
            uri={item.thumbnailUri}
            resolve={false}
            style={styles.pendingThumb}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.pendingThumb, styles.pendingThumbPlaceholder]} />
        )}
        <View style={styles.pendingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.pendingText}>Processing your post…</Text>
        </View>
      </View>
    ),
    [dark],
  );

  const renderFeedPost = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      if (item.isPending) {
        return renderPendingPost(item);
      }
      return (
        <PostItem
          post={item}
          onCommentPress={handleCommentPress}
          handleMenu={handleMenu}
          isFeedFocused={item.id === activePostId}
          feedPlaybackEnabled={playbackEnabled}
          preloadVideo={activeIndex >= 0 && Math.abs(index - activeIndex) <= 2}
        />
      );
    },
    [activePostId, activeIndex, playbackEnabled, handleCommentPress, handleMenu, renderPendingPost]
  );

  const feedListHeader = useCallback(
    () => (
      <>
        {isError && posts.length === 0 && (
          <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <Text style={{ color: dark ? '#fff' : '#000', fontSize: 16, marginBottom: 10, textAlign: 'center' }}>
              {error?.errorCode === 'ACCOUNT_BANNED' || /banned/i.test(error?.message || '')
                ? (error?.message || 'Your account has been blocked. Please contact support.')
                : error?.statusCode === 401 || error?.statusCode === 403
                ? 'Your session has expired. Please login again.'
                : error?.message?.includes('Network') || error?.message?.includes('timeout')
                ? 'Network connection error. Please check your internet connection.'
                : 'Failed to load posts. Please try again.'}
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={{
                backgroundColor: '#940304',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                marginTop: 10,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isError && (
          <StoryContainer
            stories={sortedGroupedStories}
            refreshing={refreshing || isFetchingStories}
          />
        )}
        {showFeedSkeleton && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#940304" />
          </View>
        )}
      </>
    ),
    [isError, posts.length, dark, error, refetch, sortedGroupedStories, refreshing, isFetchingStories]
  );

  const feedListFooter = useCallback(
    () => (
      <>
        {isError && posts.length > 0 && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: dark ? '#fff' : '#000', fontSize: 14, marginBottom: 10, textAlign: 'center' }}>
              {error?.errorCode === 'ACCOUNT_BANNED' || /banned/i.test(error?.message || '')
                ? (error?.message || 'Your account has been blocked. Please contact support.')
                : error?.statusCode === 401 || error?.statusCode === 403
                ? 'Your session has expired. Please login again.'
                : 'Failed to load more posts'}
            </Text>
            <TouchableOpacity
              onPress={() => fetchNextPage()}
              style={{
                backgroundColor: '#940304',
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    ),
    [isError, posts.length, dark, error, fetchNextPage],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        <TabHeader
          title="Socials"
          admin={{ profile: "https://randomuser.me/api/portraits/men/45.jpg", userId: '12345' }}
          notificationID="notif123"
          refreshing={refreshing}
        >
          <FloatingActionButton
            onStartLive={handleStartLive}
            onCreatePost={handleCreatePost}
          />
        </TabHeader>

        <FeedVideoPoolProvider
          posts={posts}
          activePostId={activePostId}
          detailPostId={reelsPostId}
          openVideoDetail={openVideoDetail}
          closeVideoDetail={closeVideoDetail}
          onReelsLoadMore={handleReelsLoadMore}
          onReelsActivePostChange={handleReelsActivePostChange}
          onReelsHidePost={hidePostById}
        >
          <FeedVideoLayout>
            <FlatList
              ref={flatListRef}
              style={{ flex: 1 }}
              data={isError && posts.length === 0 && pendingPosts.length === 0 ? [] : feedData}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderFeedPost}
              extraData={`${activePostId}-${playbackEnabled}-${pendingPosts.length}`}
              ListHeaderComponent={feedListHeader}
              ListFooterComponent={feedListFooter}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
              initialNumToRender={4}
              maxToRenderPerBatch={5}
              windowSize={11}
              updateCellsBatchingPeriod={50}
              onScroll={(event) => {
                scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
              onEndReached={loadMore}
              onEndReachedThreshold={2}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#940304']}
                  tintColor={'#940304'}
                  title="Pull to refresh"
                  titleColor={dark ? '#ffffff' : '#000000'}
                />
              }
            />
            <FeedVideoOverlay paused={!feedActive} />
          </FeedVideoLayout>
        </FeedVideoPoolProvider>
        <CommentsBottomSheet
          visible={commentModalVisible}
          comments={sheetComments}
          postId={currentPostId}
          onClose={handleCloseComments}
          onAddComment={handleAddComment}
          loading={isLoadingComments && !commentData}
        />
      </SafeAreaView>

      <PostDetailBottomsheet
        BottomIndex={BottomIndex}
        setbottomIndex={setBottomIndex}
        type={PostType}
        idCan={idCan}
        onHidePost={handleHidePost}
        onClose={() => setBottomIndex(-1)} // pass this
        hiddenPostIds={hiddenPostIds}
      />
    </GestureHandlerRootView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    position: 'relative'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#940304',
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    marginRight: 15,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    position: 'absolute', // Use absolute positioning
    bottom: 10, // Distance from the bottom
    right: 20, // Distance from the right
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: '#940304', // Red background for the button
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Shadow for Android
    shadowColor: '#940304', // Shadow color for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  floatingButtonText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  pendingCard: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 200,
    position: 'relative',
  },
  pendingThumb: {
    width: '100%',
    height: 200,
  },
  pendingThumbPlaceholder: {
    backgroundColor: '#222',
  },
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pendingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
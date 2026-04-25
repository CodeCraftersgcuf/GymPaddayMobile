import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  NativeSyntheticEvent,
  NativeScrollEvent,
  ViewToken,
} from 'react-native';
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

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserPosts } from '@/utils/queries/posts';
import * as SecureStore from 'expo-secure-store';
import { getPostComments } from '@/utils/queries/comments';
import { useMutation } from '@tanstack/react-query';
import { createComment } from '@/utils/mutations/comments';
import { groupStoriesByUser } from '@/utils/groupStories';
import { GroupedUserStories, StoryItem } from '@/utils/types/story';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchUserProfile } from '@/utils/queries/profile';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Trigger pagination when this many px from the bottom (load before user hits the absolute end). */
const PAGINATION_THRESHOLD_PX = 320;

function getNextPostsPageParam(lastPage: any): number | undefined {
  if (!lastPage) return undefined;
  const current =
    typeof lastPage.current_page === 'number'
      ? lastPage.current_page
      : typeof lastPage.meta?.current_page === 'number'
        ? lastPage.meta.current_page
        : undefined;
  const last =
    typeof lastPage.last_page === 'number'
      ? lastPage.last_page
      : typeof lastPage.meta?.last_page === 'number'
        ? lastPage.meta.last_page
        : undefined;
  if (current != null && last != null && current < last) {
    return current + 1;
  }
  const nextUrl = lastPage.next_page_url;
  if (typeof nextUrl === 'string' && nextUrl.length > 0) {
    try {
      const url = nextUrl.startsWith('http')
        ? new URL(nextUrl)
        : new URL(nextUrl, 'https://gympaddy.local');
      const p = parseInt(url.searchParams.get('page') || '', 10);
      if (Number.isFinite(p) && p > 0) return p;
    } catch {
      /* ignore bad URL */
    }
  }
  return undefined;
}

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
  const [posts, setPosts] = useState<any[]>([]);
  const queryClient = useQueryClient();
  const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([]);
  const logoutTriggeredRef = useRef(false);
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 65,
    minimumViewTime: 120,
  }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const tok = viewableItems.find((v) => v.isViewable && v.item);
      const raw = tok?.item?.id;
      const id = raw != null ? Number(raw) : null;
      setActivePostId(Number.isFinite(id) ? id : null);
    }
  ).current;

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
      return getUserPosts(token, pageParam); // Accepts page number
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextPostsPageParam(lastPage),
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
    staleTime: 0, // Always treat as stale so invalidation/refetch after edit updates the feed
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  useEffect(() => {
    if (isError && error) {
      handleBlockedOrUnauthorized(error);
    }
  }, [isError, error]);


  const [groupedStories, setGroupedStories] = useState<GroupedUserStories[]>([]);
  const [loading, setLoading] = useState(true);
  const getToken = async () => {
    return await SecureStore.getItemAsync('auth_token');
  }
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch(`https://api.gympaddy.com/api/user/get/stories`, {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        });
        const json = await response.json();
        const { stories = [], my_stories = [] } = json;
        const groupedStories = groupStoriesByUser(stories);
        const myGroupedStories = groupStoriesByUser(my_stories);
        setGroupedStories([
          ...myGroupedStories,
          ...groupedStories,
        ]);
      } catch (err) {
        console.error('Error fetching stories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);
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
  });
  // console.log("The Comments Data:", commentData);
  console.log("post comments", commentData);
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

  const handleAddComment = async (text: string, postId: number, parentId?: string) => {
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

    console.log('Adding comment to post:', postId, text);
  };

  const handleCommentPress = (comments: any[], postId: number) => {
    setCurrentPostId(postId);
    setCommentModalVisible(true);
    // Clear any existing optimistic comments when opening new comment modal
    setOptimisticComments([]);
    refetchComments();
  };

  const handleCloseComments = () => {
    setCommentModalVisible(false);
    setCurrentPostId(null);
    // Clear optimistic comments when closing modal
    setOptimisticComments([]);
  };

  useEffect(() => {
    if (data?.pages) {
      const allPosts = data.pages.flatMap(page => page.data || []); // assuming response has .data field

      const formatted = allPosts.map((post: any) => ({
        id: Number(post.id),
        user: {
          id: post.user?.id,
          username: post.user?.username,
          profile_picture: post.user?.profile_picture_url,
        },
        content: post.content || post.title || '',
        imagesUrl: post.media
          ?.filter((m: any) => m.media_type === 'image')
          .map((m: any) => m.url) || [],
        videoUrl: post.media?.find((m: any) => m.media_type === 'video')?.url || null,
        timestamp: post.created_at,
        likes_count: post.likes?.length || 0,
        comments_count: post.comments?.length || 0,
        view_count: 0,
        share_count: 0,
        likes: post.likes?.map((like: any) => ({
          id: like.id,
          user: {
            id: like.user?.id,
            username: like.user?.username || 'Unknown',
            fullname: like.user?.fullname || '',
            profile_picture_url: like.user?.profile_picture_url || '',
          }
        })) || [],
        recent_comments: post.comments?.slice(0, 2).map((comment: any) => ({
          id: comment.id,
          user: {
            username: comment.user?.username || 'Unknown',
            profile_picture: comment.user?.profile_picture_url || '',
          },
          text: comment.content || '',
        })) || [],
      }));

      // Filter out hidden posts - ensure we check against the hiddenPostIds array
      const hiddenIdsSet = new Set(hiddenPostIds.map(id => Number(id)));
      const filtered = formatted.filter((post: any) => {
        const postId = Number(post.id);
        return !hiddenIdsSet.has(postId);
      });
      
      console.log('📊 Filtering posts - Total:', formatted.length, 'Hidden:', hiddenPostIds.length, 'Filtered:', filtered.length);
      setPosts(filtered);
    }
  }, [data, hiddenPostIds]);



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

  const handleMenu = (userId: any, postId: any) => {
    setPostType(userId == 100 ? 'userpost' : 'ViewerPost');
    setBottomIndex(1);
    setidCan({ userId, postId });
    console.log('click bottom sheet', userId, postId);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);

    // Refresh posts
    await refetch();

    // Refresh stories
    try {
      const response = await fetch(`https://api.gympaddy.com/api/user/get/stories`, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      const json = await response.json();
      const { stories = [], my_stories = [] } = json;

      const groupedStories = groupStoriesByUser(stories);
      const myGroupedStories = groupStoriesByUser(my_stories);

      setGroupedStories([
        ...myGroupedStories,
        ...groupedStories,
      ]);
    } catch (err) {
      console.error('Error refreshing stories:', err);
    }

    setRefreshing(false);
  }, [refetch]);

  const tryFetchNextPage = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      if (contentSize.height <= 0) return;
      const distanceFromEnd =
        contentSize.height - (layoutMeasurement.height + contentOffset.y);
      if (distanceFromEnd > PAGINATION_THRESHOLD_PX) return;
      if (!hasNextPage || isFetchingNextPage) return;
      fetchNextPage();
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  // Show loading indicator while user posts are loading
  // if (isLoading) {
  //   return <LoadingIndicator text="Loading posts..." />;
  // }

  const handleHidePost = async () => {
    console.log('🔒 Hiding post:', idCan);
    
    if (idCan && 'postId' in idCan && idCan.postId) {
      const postIdToHide = Number(idCan.postId);
      
      // Update hidden posts list first to ensure state is updated
      setHiddenPostIds(prev => {
        // Check if already hidden to avoid duplicates
        if (prev.includes(postIdToHide)) {
          console.log('⚠️ Post already in hidden list:', postIdToHide);
          return prev;
        }
        
        const updated = [...prev, postIdToHide];
        
        // Save to AsyncStorage
        AsyncStorage.setItem('hidden_post_ids', JSON.stringify(updated))
          .then(() => {
            console.log('✅ Hidden post saved to storage:', postIdToHide);
          })
          .catch((err) => {
            console.error('❌ Failed to persist hidden posts:', err);
          });
        
        return updated;
      });
      
      // Immediately remove from UI
      setPosts(prev => prev.filter(p => Number(p.id) !== postIdToHide));
      
      // Close the bottom sheet
      setBottomIndex(-1);
      
      console.log('✅ Post hidden successfully:', postIdToHide);
    } else {
      console.warn('⚠️ No postId found in idCan:', idCan);
    }
  };
  const mapApiCommentsToInternal = (apiComments: any[]): Comment[] => {
    return (apiComments || []).map((item) => ({
      id: item.id.toString(),
      userId: item.user?.id?.toString() || '',
      username: item.user?.username || 'Unknown',
      profileImage: item.user?.profile_picture_url || '',
      text: item.content || '',
      timestamp: item.created_at,
      likes: 0,
      replies: mapApiCommentsToInternal(item.replies || [])
    }));
  };
  useEffect(() => {
    const prefetchProfiles = async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const uniqueUserIds = Array.from(new Set(posts.map(post => post.user?.id)));

      // Prefetch profiles with delay to avoid rate limiting
      // Limit to first 10 users to prevent too many requests
      const limitedUserIds = uniqueUserIds.slice(0, 10);
      
      for (let i = 0; i < limitedUserIds.length; i++) {
        const id = limitedUserIds[i];
        // Add delay between requests to avoid rate limiting
        setTimeout(() => {
          console.log('Prefetching profile for user ID:', id);
          queryClient.prefetchQuery({
            queryKey: ['userProfile', id],
            queryFn: () => fetchUserProfile(token, id),
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
          });
        }, i * 200); // 200ms delay between each request
      }
    };

    if (posts.length > 0) {
      prefetchProfiles();
    }
  }, [posts]);


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        <TabHeader
          title="Socials"
          admin={{ profile: "https://randomuser.me/api/portraits/men/45.jpg", userId: '12345' }}
          notificationID="notif123"
          refreshing={refreshing} // Pass refreshing state to TabHeader
        />

        <FlatList
          style={{ flex: 1 }}
          data={posts}
          extraData={{ activePostId, posts }}
          keyExtractor={(item) => item.id.toString()}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={tryFetchNextPage}
          onMomentumScrollEnd={tryFetchNextPage}
          onScrollEndDrag={tryFetchNextPage}
          scrollEventThrottle={16}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
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
          ListHeaderComponent={
            <View>
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
                <StoryContainer stories={groupedStories ?? []} refreshing={refreshing} />
              )}
            </View>
          }
          ListEmptyComponent={
            !isError && posts.length === 0 && !isLoading ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: dark ? '#fff' : '#000' }}>No posts yet.</Text>
              </View>
            ) : !isError && posts.length === 0 && isLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#940304" />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const primaryId = activePostId ?? posts[0]?.id ?? null;
            const pid = Number(item.id);
            return (
              <PostItem
                post={item}
                isFeedVideoActive={primaryId != null && pid === primaryId}
                onCommentPress={handleCommentPress}
                handleMenu={handleMenu}
              />
            );
          }}
          ListFooterComponent={
            <View>
              {hasNextPage && posts.length > 0 && (
                <View
                  style={{
                    paddingVertical: isFetchingNextPage ? 20 : 8,
                    alignItems: 'center',
                    paddingBottom: isFetchingNextPage ? 120 : 80,
                  }}
                >
                  {isFetchingNextPage && (
                    <>
                      <ActivityIndicator size="small" color="#940304" />
                      <Text style={{ color: dark ? '#fff' : '#000', marginTop: 8 }}>
                        Loading more posts…
                      </Text>
                    </>
                  )}
                </View>
              )}
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
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
        <CommentsBottomSheet
          visible={commentModalVisible}
          comments={[...mapApiCommentsToInternal(commentData), ...optimisticComments]}
          postId={currentPostId}
          onClose={handleCloseComments}
          onAddComment={handleAddComment}
          loading={false}
        />


        <FloatingActionButton
          onStartLive={handleStartLive}
          onCreatePost={handleCreatePost}
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
    color: '#fff', // White text color
    fontWeight: 'bold',
  },
});
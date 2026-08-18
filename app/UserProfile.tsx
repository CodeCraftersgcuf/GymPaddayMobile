import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Share,
  Modal,
  TextInput,
  type ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons as Icon, MaterialIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import FollowersBottomSheet, { User } from '@/components/Social/post/FollowersBottomSheet';
import FollowingBottomSheet from '@/components/Social/post/FollowingBottomSheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { images } from '@/constants';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUserProfile } from '@/utils/queries/profile';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import { followUnfollowUser, getFollowerList, getFollowingList } from '@/utils/queries/socialMedia';
import { useTheme } from '@/contexts/themeContext';
import { ChatMessagePayload, sendChatMessage } from '@/utils/mutations/chat';
import { createGift } from '@/utils/mutations/gifts';
import { useIosMonetizationHidden } from '@/utils/iosMonetization';
import Toast from 'react-native-toast-message';
import { blockUser, restrictUser } from '@/utils/utils/userPrivacyStorage';
// import { blockUser, restrictUser } from '@/utils/userPrivacyStorage'; // adjust path

import { resolveMediaUrl } from '@/utils/mediaUrl';
import { STALE_TIMES } from '@/utils/queryClient';
import { useSilentInfiniteScroll } from '@/utils/useSilentInfiniteScroll';
import { useSafeBack } from '@/utils/hooks/useSafeBack';
import { openSinglePost } from '@/utils/prefetchNavigation';
import { seedPostCaches } from '@/utils/postCache';
import {
  prefetchProfileGridVideos,
  prefetchVideoForPostId,
  prefetchVideoFromRawPost,
} from '@/utils/videoPrefetch';

const { width } = Dimensions.get('window');
const imageSize = (width - 30) / 3;

type ProfileGridItem = {
  postId: number;
  postIndex: number;
  mediaIndex: number;
  media_type: 'image' | 'video';
  url: string;
};

function isVideoMedia(mediaItem: any): boolean {
  if (!mediaItem) return false;
  if (mediaItem.media_type === 'video') return true;
  const url = mediaItem.url || '';
  return /\.(mp4|mov|avi|webm|m3u8)(\?|$)/i.test(url);
}

function pickDisplayMedia(post: any) {
  if (!Array.isArray(post?.media) || post.media.length === 0) return null;

  const video = post.media.find(isVideoMedia);
  const image = post.media.find((m: any) => m.media_type === 'image');

  if (video) {
    const thumb =
      resolveMediaUrl(video.thumbnail_url || video.thumbnail) ||
      resolveMediaUrl(video.url);
    if (!thumb) return null;
    return {
      media: video,
      mediaIndex: post.media.indexOf(video),
      media_type: 'video' as const,
      url: thumb,
    };
  }

  if (image) {
    const url = resolveMediaUrl(image.url);
    if (!url) return null;
    return {
      media: image,
      mediaIndex: post.media.indexOf(image),
      media_type: 'image' as const,
      url,
    };
  }

  const fallback = post.media[0];
  const url = resolveMediaUrl(fallback.url);
  if (!url) return null;
  return {
    media: fallback,
    mediaIndex: 0,
    media_type: isVideoMedia(fallback) ? ('video' as const) : ('image' as const),
    url,
  };
}

/** Posts tab: one grid tile per post (images + videos). */
function getAllPostsForGrid(posts: any[]): ProfileGridItem[] {
  if (!Array.isArray(posts)) return [];

  return posts
    .map((post, postIndex) => {
      const picked = pickDisplayMedia(post);
      if (!picked) return null;

      return {
        postId: post.id,
        postIndex,
        mediaIndex: picked.mediaIndex,
        media_type: picked.media_type,
        url: picked.url,
      };
    })
    .filter((item): item is ProfileGridItem => item != null);
}

/** Videos tab: only posts that contain video. */
function getVideoPostsForGrid(posts: any[]): ProfileGridItem[] {
  if (!Array.isArray(posts)) return [];

  return posts
    .map((post, postIndex) => {
      if (!Array.isArray(post?.media)) return null;
      const video = post.media.find(isVideoMedia);
      if (!video) return null;

      const url =
        resolveMediaUrl(video.thumbnail_url || video.thumbnail) ||
        resolveMediaUrl(video.url);
      if (!url) return null;

      return {
        postId: post.id,
        postIndex,
        mediaIndex: post.media.indexOf(video),
        media_type: 'video' as const,
        url,
      };
    })
    .filter((item): item is ProfileGridItem => item != null);
}


export default function ProfileScreen() {
  const { dark } = useTheme();
  const { blocked: hideIosMonetization } = useIosMonetizationHidden();
  const goBack = useSafeBack();
  const theme = {
    background: dark ? '#000000' : '#FAFAFA',
    secondary: dark ? '#181818' : '#f5f5f5',
    text: dark ? '#ffffff' : '#000000',
    textSecondary: dark ? '#999999' : '#666666',
    border: dark ? '#333333' : '#e0e0e0',
    Mbtn: dark ? '#FFFFFF80' : '#000000',
  };

  const [activeTab, setActiveTab] = useState('posts');
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftAmount, setGiftAmount] = useState('10');
  const [sendingGift, setSendingGift] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const followersSheetRef = useRef<BottomSheet>(null);
  const followingSheetRef = useRef<BottomSheet>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [loadFollowers, setLoadFollowers] = useState(false);
  const [loadFollowing, setLoadFollowing] = useState(false);
  const { user_id, username, profile_picture } = useLocalSearchParams<{
    user_id?: string;
    username?: string;
    profile_picture?: string;
  }>();
  const queryClient = useQueryClient();

  const profileUserId = user_id ? String(user_id) : '';

  const profilePlaceholder = useMemo(() => {
    if (!username && !profile_picture) return undefined;
    return {
      status: 'success',
      user: {
        username: username || '',
        profile_picture_url: profile_picture ? resolveMediaUrl(profile_picture) : undefined,
      },
      bio: '',
      followers_count: undefined,
      following_count: undefined,
      post_count: undefined,
      posts: [],
      is_following: false,
    };
  }, [username, profile_picture]);

  // Mutations
  const followMutation = useMutation({
    mutationFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');
      return await followUnfollowUser(Number(user_id), token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers', profileUserId] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', profileUserId] });
    },
    onError: (error) => {
      console.error('Error following/unfollowing user:', error);
    },
  });

  const {
    data: profilePages,
    isLoading,
    isFetching,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['userProfile', profileUserId],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      return await fetchUserProfile(token, Number(profileUserId), pageParam, 9);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage?.posts_pagination?.has_more
        ? lastPage.posts_pagination.current_page + 1
        : undefined,
    enabled: !!profileUserId,
    placeholderData: profilePlaceholder
      ? { pages: [profilePlaceholder], pageParams: [1] }
      : undefined,
    staleTime: STALE_TIMES.profile,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.statusCode === 429) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const data = useMemo(() => {
    if (!profilePages?.pages?.length) return undefined;
    const first = profilePages.pages[0];
    const allPosts = profilePages.pages.flatMap((page) => page?.posts ?? []);
    return { ...first, posts: allPosts };
  }, [profilePages]);

  useEffect(() => {
    if (!profilePages?.pages?.length) return;
    const rawPosts = profilePages.pages.flatMap((page) => page?.posts ?? []);
    seedPostCaches(rawPosts);
    rawPosts.slice(0, 9).forEach((post) => prefetchVideoFromRawPost(post));
  }, [profilePages?.pages]);

  const {
    data: followersApiData,
    isLoading: isLoadingFollowers,
  } = useQuery({
    queryKey: ['followers', profileUserId],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      return await getFollowerList(Number(user_id), token);
    },
    enabled: !!profileUserId && loadFollowers,
  });

  const {
    data: followingApiData,
    isLoading: isLoadingFollowing,
  } = useQuery({
    queryKey: ['following', profileUserId],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      return await getFollowingList(Number(user_id), token);
    },
    enabled: !!profileUserId && loadFollowing,
  });

  // Fetch auth user data
  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await SecureStore.getItemAsync('user_data');
      if (userData) {
        setAuthUser(JSON.parse(userData));
      }
    };
    fetchUserData();
  }, []);

  // Show error toast for rate limiting
  useEffect(() => {
    if (error) {
      const apiError = error as any;
      if (apiError?.statusCode === 429) {
        Toast.show({
          type: 'error',
          text1: 'Too Many Requests',
          text2: apiError.message || 'Please wait a moment before trying again.',
          visibilityTime: 5000,
        });
      }
    }
  }, [error]);

  // Map API users
  const mapApiUsers = (
    arr: any[],
    listType: 'followers' | 'following'
  ): User[] =>
    (arr || []).map((item: any) => {
      const user = listType === 'followers' ? item.follower : item.followed;
      return {
        id: user?.id?.toString() ?? '',
        name: user?.username || user?.name || 'Unknown',
        avatar:
          user?.profile_picture_url ||
          user?.avatar ||
          'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        isFollowing: !!user?.is_following_back,
      };
    });

  const followers = Array.isArray(followersApiData)
    ? mapApiUsers(followersApiData, 'followers')
    : [];

  const following = followingApiData && Array.isArray(followingApiData)
    ? mapApiUsers(followingApiData, 'following')
    : [];

  const snapPoints = useMemo(() => ['25%', '50%'], []);
  const handleSheetChanges = useCallback((index: number) => {
    // No-op or logging
  }, []);
  const profileUrl = data?.user?.username
    ? `https://gympaddy.com/@${data.user.username}`
    : `https://gympaddy.com/user/${user_id}`;

  const handleCopyProfileUrl = async () => {
    if (!profileUrl) return;
    await Clipboard.setStringAsync(profileUrl);
    Toast.show({
      type: 'success',
      text1: 'Profile URL copied',
      text2: profileUrl, // Show the copied URL
    });
    bottomSheetRef.current?.close();
  };

  const handleShareProfile = async () => {
    if (!profileUrl) return;
    try {
      await Share.share({ message: profileUrl });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Share failed',
        text2: err?.message || 'Unable to share profile',
      });
    } finally {
      bottomSheetRef.current?.close();
    }
  };

  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };
  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };
  const openFollowersSheet = () => {
    setLoadFollowers(true);
    followersSheetRef.current?.expand();
  };
  const openFollowingSheet = () => {
    setLoadFollowing(true);
    followingSheetRef.current?.expand();
  };
  const navigateToListings = () => {
    closeBottomSheet();
    router.push({
      pathname: '/UserListing',
      params: { user_id: user_id?.toString() }
    });
  };
  const handleListingPress = () => {
    router.push({
      pathname: '/UserListing',
      params: { user_id: user_id?.toString() }
    });
  };

  // Message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      const userData = await SecureStore.getItemAsync('user_data');
      if (!token || !userData) throw new Error('Auth data missing');
      const parsedUser = JSON.parse(userData);
      const payload: ChatMessagePayload = {
        sender_id: parsedUser.id,
        receiver_id: Number(user_id),
        message: 'Hi, I’d like to connect with you!',
      };
      return await sendChatMessage(payload, token);
    },
    onSuccess: (res) => {
      Toast.show({
        type: 'success',
        text1: 'Message sent',
        text2: 'Your message has been sent to the user',
      });
      router.push({
        pathname: '/(tabs)/chat',
        params: {
          receiver_id: user_id?.toString(),
        },
      });
    },
    onError: (err) => {
      console.error('Error sending message:', err);
    },
  });

  const handleSendProfileGift = async () => {
    const amount = Number(giftAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Toast.show({ type: 'error', text1: 'Enter a valid GP amount' });
      return;
    }
    setSendingGift(true);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('Not authenticated');
      await createGift({
        token,
        data: {
          to_user_id: Number(user_id),
          name: 'GP Gift',
          value: amount,
          message: `Sent ${amount} GP`,
        },
      });
      setShowGiftModal(false);
      Toast.show({
        type: 'success',
        text1: 'Gift sent',
        text2: `${amount} GP sent successfully`,
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Gift failed',
        text2: err?.message || 'Could not send gift',
      });
    } finally {
      setSendingGift(false);
    }
  };
  // Add refreshing state for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Handler for pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // Refetch all relevant queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['userProfile', profileUserId] }),
      queryClient.invalidateQueries({ queryKey: ['followers', profileUserId] }),
      queryClient.invalidateQueries({ queryKey: ['following', profileUserId] }),
    ]);
    setRefreshing(false);
  };

  // Media grid — smaller pages + silent prefetch (Instagram-style)
  const allPostsMedia = useMemo(() => getAllPostsForGrid(data?.posts), [data?.posts]);
  const videoPostsMedia = useMemo(() => getVideoPostsForGrid(data?.posts), [data?.posts]);
  const mediaArray = useMemo(
    () => (activeTab === 'posts' ? allPostsMedia : videoPostsMedia),
    [activeTab, allPostsMedia, videoPostsMedia],
  );
  const mediaArrayRef = useRef(mediaArray);
  useEffect(() => {
    mediaArrayRef.current = mediaArray;
  }, [mediaArray]);

  const { loadMore, onPrefetchViewableItemsChanged, prefetchViewabilityConfig } =
    useSilentInfiniteScroll({
      itemCount: mediaArray.length,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
      thresholdFromEnd: 5,
      firstPageReady: Boolean(profilePages?.pages?.[0]?.posts?.length),
      resetKey: profileUserId,
    });

  const onGridViewableItemsChanged = useRef(
    (info: { viewableItems: ViewToken[] }) => {
      onPrefetchViewableItemsChanged(info);
      prefetchProfileGridVideos(mediaArrayRef.current, info.viewableItems);
    },
  ).current;

  const renderGridItem = useCallback(
    ({ item }: { item: ProfileGridItem }) => (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.8}
        onPressIn={() => {
          if (item.media_type === 'video') {
            prefetchVideoForPostId(item.postId);
          }
        }}
        onPress={() =>
          openSinglePost(router, item.postId, {
            videoThumbnailUrl: item.media_type === 'video' ? item.url : undefined,
          })
        }
      >
        {item.media_type === 'video' ? (
          <View>
            <Image
              source={{ uri: item.url }}
              style={styles.gridImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={`${item.postId}-${item.mediaIndex}`}
              transition={150}
            />
            <View style={styles.playButton}>
              <Icon name="play" size={24} color="#fff" />
            </View>
          </View>
        ) : (
          <Image
            source={{ uri: item.url }}
            style={styles.gridImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={`${item.postId}-${item.mediaIndex}`}
            transition={150}
          />
        )}
      </TouchableOpacity>
    ),
    [],
  );

  const profileListHeader = useMemo(
    () => (
      <>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: data?.user?.profile_picture_url }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <Text style={[styles.name, { color: theme.text }]}>{data?.user.username}</Text>
          <Text style={[styles.bio, { color: theme.textSecondary }]}>
            {data?.bio || data?.user?.bio || ''}
          </Text>

          <View style={[styles.statsContainer, { backgroundColor: theme.secondary }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {data?.post_count ?? '–'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Posts</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <TouchableOpacity style={styles.statItem} onPress={openFollowersSheet}>
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {data?.followers_count ?? '–'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <TouchableOpacity style={styles.statItem} onPress={openFollowingSheet}>
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {data?.following_count ?? '–'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Following</Text>
            </TouchableOpacity>
          </View>

          {authUser && authUser?.id != user_id && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.followButton}
                onPress={() => followMutation.mutate()}
                disabled={followMutation.isPending}
              >
                {followMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.followButtonText}>
                    {data?.is_following ? 'Unfollow' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.messageButton, { backgroundColor: theme.Mbtn }]}
                onPress={() => sendMessageMutation.mutate()}
              >
                <Text style={[styles.messageButtonText, { color: 'white' }]}>Message</Text>
              </TouchableOpacity>
              {!hideIosMonetization && (
                <TouchableOpacity
                  style={[styles.messageButton, styles.giftProfileBtn]}
                  onPress={() => {
                    setGiftAmount('10');
                    setShowGiftModal(true);
                  }}
                >
                  <Text style={[styles.messageButtonText, { color: '#C61F3A' }]}>Gift GP</Text>
                </TouchableOpacity>
              )}
              {data?.is_business && (
                <TouchableOpacity
                  onPress={() => handleListingPress()}
                  style={[styles.messageButton, styles.listingBtn, { backgroundColor: 'transparent' }]}
                >
                  <Text style={[styles.messageButtonText, { color: '#C61F3A' }]}>Listing</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {authUser && authUser?.id == user_id && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => router.push('/EditProfile')}
                style={styles.followButton}
              >
                <Text style={styles.followButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleListingPress()}
                style={[styles.messageButton, styles.listingBtn, { backgroundColor: 'transparent' }]}
              >
                <Text style={[styles.messageButtonText, { color: '#C61F3A' }]}>Listing</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.tabContainer, { backgroundColor: theme.background }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Image
              source={images.profileImages}
              style={{
                width: 20,
                height: 20,
                tintColor: activeTab === 'posts' ? theme.text : theme.textSecondary,
              }}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'posts' ? theme.text : theme.textSecondary },
              ]}
            >
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
            onPress={() => setActiveTab('videos')}
          >
            <Image
              source={images.profileVideos}
              style={{
                width: 20,
                height: 20,
                tintColor: activeTab === 'videos' ? theme.text : theme.textSecondary,
              }}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'videos' ? theme.text : theme.textSecondary },
              ]}
            >
              Videos
            </Text>
          </TouchableOpacity>
        </View>
      </>
    ),
    [
      data,
      theme,
      authUser,
      user_id,
      activeTab,
      followMutation,
      sendMessageMutation,
      openFollowersSheet,
      openFollowingSheet,
      handleListingPress,
      hideIosMonetization,
    ],
  );

  const listEmptyComponent = useMemo(() => {
    if (isFetching && !mediaArray.length) {
      return (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <ActivityIndicator size="small" color="#C61F3A" />
        </View>
      );
    }

    return (
      <View style={{ alignItems: 'center', padding: 40 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
          {activeTab === 'posts' ? 'No posts yet' : 'No videos yet'}
        </Text>
      </View>
    );
  }, [isFetching, mediaArray.length, activeTab, theme.textSecondary]);

  if (isLoading && !data) {
    return (
      <GestureHandlerRootView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color="#C61F3A" />
        <Text style={{ color: theme.text, fontSize: 18, marginTop: 16 }}>Loading profile...</Text>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <TouchableOpacity onPress={goBack}>
            <Icon name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{ }</Text>
          <TouchableOpacity onPress={openBottomSheet}>
            <Icon name="ellipsis-vertical" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          key={activeTab}
          data={mediaArray}
          numColumns={3}
          keyExtractor={(item) => `${item.postId}-${item.mediaIndex}`}
          renderItem={renderGridItem}
          ListHeaderComponent={profileListHeader}
          ListEmptyComponent={listEmptyComponent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          onViewableItemsChanged={onGridViewableItemsChanged}
          viewabilityConfig={prefetchViewabilityConfig}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={9}
          windowSize={7}
          removeClippedSubviews
          contentContainerStyle={styles.gridListContent}
          columnWrapperStyle={mediaArray.length ? styles.gridRow : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#C61F3A']}
              tintColor={'#C61F3A'}
              title="Pull to refresh"
              titleColor={theme.text}
            />
          }
        />

        {/* Main Options Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enablePanDownToClose={true}
          backgroundStyle={{ backgroundColor: theme.secondary }}
          handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
        >
          <BottomSheetView style={[styles.bottomSheetContent, { backgroundColor: theme.secondary }]}>
            <Text style={[styles.bottomSheetTitle, { color: theme.text }]}>More Options</Text>

            <TouchableOpacity style={styles.bottomSheetOption} onPress={handleCopyProfileUrl}>
              <MaterialIcons name="content-copy" size={24} color={theme.text} />
              <Text style={[styles.bottomSheetOptionText, { color: theme.text }]}>Copy profile URL</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomSheetOption} onPress={handleShareProfile}>
              <Icon name="share-outline" size={24} color={theme.text} />
              <Text style={[styles.bottomSheetOptionText, { color: theme.text }]}>Share Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomSheetOption} onPress={navigateToListings}>
              <MaterialIcons name="list" size={24} color={theme.text} />
              <Text style={[styles.bottomSheetOptionText, { color: theme.text }]}>Listings</Text>
            </TouchableOpacity>

            {/*  */}

            <TouchableOpacity
              style={styles.bottomSheetOption}
              onPress={async () => {
                await restrictUser(user_id?.toString());
                Toast.show({
                  type: 'info',
                  text1: 'User Restricted',
                  text2: 'This user is now restricted.',
                });
                bottomSheetRef.current?.close();
              }}
            >
              <Icon name="warning-outline" size={24} color="#C61F3A" />
              <Text style={[styles.bottomSheetOptionText, { color: '#C61F3A' }]}>Restrict</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomSheetOption}
              onPress={async () => {
                await blockUser(user_id?.toString());
                Toast.show({
                  type: 'error',
                  text1: 'User Blocked',
                  text2: 'You have blocked this user.',
                });
                bottomSheetRef.current?.close();
              }}
            >
              <MaterialIcons name="block" size={24} color="#C61F3A" />
              <Text style={[styles.bottomSheetOptionText, { color: '#C61F3A' }]}>Block User</Text>
            </TouchableOpacity>

          </BottomSheetView>
        </BottomSheet>

        {/* Followers Bottom Sheet */}
        <FollowersBottomSheet
          ref={followersSheetRef}
          users={followers}
          title="Followers"
          count={Array.isArray(followers) ? followers.length : 0}
          dark={dark}
          onFollowToggle={() => { }}
          onClose={() => followersSheetRef.current?.close()}
          loading={isLoadingFollowers}
          emptyText="No followers found."
        />

        {/* Following Bottom Sheet */}
        <FollowingBottomSheet
          ref={followingSheetRef}
          userId={user_id}
          users={following}
          title="Following"
          count={Array.isArray(following) ? following.length : 0}
          dark={dark}
          onFollowToggle={() => { }}
          onClose={() => followingSheetRef.current?.close()}
          loading={isLoadingFollowing}
          emptyText="No following found."
        />

        <Modal
          visible={showGiftModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGiftModal(false)}
        >
          <View style={styles.giftModalOverlay}>
            <View style={[styles.giftModalCard, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.giftModalTitle, { color: theme.text }]}>Send GP Gift</Text>
              <Text style={[styles.giftModalHint, { color: theme.textSecondary }]}>
                Enter how many GP coins to send to {data?.user?.username || 'this user'}.
              </Text>
              <TextInput
                style={[
                  styles.giftModalInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                ]}
                keyboardType="numeric"
                value={giftAmount}
                onChangeText={setGiftAmount}
                placeholder="10"
                placeholderTextColor={theme.textSecondary}
              />
              <View style={styles.giftModalActions}>
                <TouchableOpacity
                  style={[styles.giftModalBtn, styles.giftModalCancel]}
                  onPress={() => setShowGiftModal(false)}
                  disabled={sendingGift}
                >
                  <Text style={{ color: theme.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.giftModalBtn, styles.giftModalSend]}
                  onPress={handleSendProfileGift}
                  disabled={sendingGift}
                >
                  {sendingGift ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Send</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView >
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
    // borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#000000B2',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  followButton: {
    flex: 1,
    backgroundColor: '#C61F3A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  listingBtn: {
    borderWidth: 1,
    borderColor: 'red'
  },
  giftProfileBtn: {
    borderWidth: 1,
    borderColor: '#C61F3A',
    backgroundColor: 'transparent',
  },
  giftModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  giftModalCard: {
    borderRadius: 16,
    padding: 20,
  },
  giftModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  giftModalHint: {
    fontSize: 14,
    marginBottom: 14,
  },
  giftModalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  giftModalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  giftModalBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  giftModalCancel: {
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  giftModalSend: {
    backgroundColor: '#C61F3A',
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#C61F3A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 5,
  },
  gridListContent: {
    paddingBottom: 24,
  },
  gridRow: {
    paddingHorizontal: 5,
    gap: 5,
  },
  gridItem: {
    width: imageSize,
    height: imageSize,
    margin: 2.5,
    position: 'relative',
    borderColor: '#333333',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  bottomSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  bottomSheetOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
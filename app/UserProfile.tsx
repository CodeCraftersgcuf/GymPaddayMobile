import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons as Icon, MaterialIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import FollowersBottomSheet, { User } from '@/components/Social/post/FollowersBottomSheet';
import FollowingBottomSheet from '@/components/Social/post/FollowingBottomSheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { images } from '@/constants';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUserProfile } from '@/utils/queries/profile';
import * as SecureStore from 'expo-secure-store';
import { followUnfollowUser, getFollowerList, getFollowingList } from '@/utils/queries/socialMedia';
import { useTheme } from '@/contexts/themeContext';
import { ChatMessagePayload, sendChatMessage } from '@/utils/mutations/chat';
import Toast from 'react-native-toast-message';
import { Video } from 'expo-av';
import { blockUser, restrictUser } from '@/utils/utils/userPrivacyStorage';
// import { blockUser, restrictUser } from '@/utils/userPrivacyStorage'; // adjust path

const { width } = Dimensions.get('window');
const imageSize = (width - 30) / 3;

const profileData = {
  name: 'Adewale',
  bio: 'Here to have fun, make friends and stay healthy',
  posts: 50,
  followers: 3255,
  following: 100,
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
};

// function getMediaByType(posts, type: 'image' | 'video') {
//   if (!Array.isArray(posts)) return [];
//   return posts.flatMap((post, postIndex) =>
//     (Array.isArray(post.media) ? post.media : [])
//       .filter(mediaItem =>
//         type === 'image'
//           ? mediaItem.media_type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(mediaItem.url)
//           : mediaItem.media_type === 'video' || /\.(mp4|mov|avi|webm)$/i.test(mediaItem.url)
//       )
//       .map((mediaItem, mediaIndex) => ({
//         ...mediaItem,
//         postIndex,
//         mediaIndex,
//       }))
//   );
// }
function getMediaByType(posts, type: 'image' | 'video') {
  if (!Array.isArray(posts)) return [];

  const seenPostIds = new Set();

  return posts
    .map((post, postIndex) => {
      if (!Array.isArray(post.media)) return null;

      const firstMedia = post.media.find((mediaItem) =>
        type === 'image'
          ? mediaItem.media_type === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(mediaItem.url)
          : mediaItem.media_type === 'video' || /\.(mp4|mov|avi|webm)$/i.test(mediaItem.url)
      );

      if (firstMedia && !seenPostIds.has(post.id)) {
        seenPostIds.add(post.id);
        return {
          ...firstMedia,
          postIndex,
          mediaIndex: 0, // always first
          postId: post.id,
        };
      }

      return null;
    })
    .filter(Boolean); // remove nulls
}


export default function ProfileScreen() {
  // --- All hooks at the top ---
  const { dark } = useTheme();
  const [activeTab, setActiveTab] = useState('posts');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const followersSheetRef = useRef<BottomSheet>(null);
  const followingSheetRef = useRef<BottomSheet>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const { user_id } = useLocalSearchParams<{ user_id?: any }>();
  const queryClient = useQueryClient();

  // Mutations
  const followMutation = useMutation({
    mutationFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');
      return await followUnfollowUser(Number(user_id), token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers', user_id] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', user_id] });
    },
    onError: (error) => {
      console.error('Error following/unfollowing user:', error);
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['userProfile', user_id],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      return await fetchUserProfile(token, Number(user_id));
    },
    enabled: !!user_id,
  });

  const {
    data: followersApiData,
    isLoading: isLoadingFollowers,
  } = useQuery({
    queryKey: ['followers', user_id],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      return await getFollowerList(Number(user_id), token);
    },
    enabled: !!user_id,
  });

  const {
    data: followingApiData,
    isLoading: isLoadingFollowing,
  } = useQuery({
    queryKey: ['following', user_id],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      return await getFollowingList(Number(user_id), token);
    },
    enabled: !!user_id,
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

  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };
  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };
  const openFollowersSheet = () => {
    followersSheetRef.current?.expand();
  };
  const openFollowingSheet = () => {
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

  // Add refreshing state for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Handler for pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // Refetch all relevant queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['userProfile', user_id] }),
      queryClient.invalidateQueries({ queryKey: ['followers', user_id] }),
      queryClient.invalidateQueries({ queryKey: ['following', user_id] }),
    ]);
    setRefreshing(false);
  };

  // Theme
  const theme = {
    background: dark ? '#000000' : '#FAFAFA',
    secondary: dark ? '#181818' : '#f5f5f5',
    text: dark ? '#ffffff' : '#000000',
    textSecondary: dark ? '#999999' : '#666666',
    border: dark ? '#333333' : '#e0e0e0',
    Mbtn: dark ? '#FFFFFF80' : '#000000',
  };

  // Media grid
  const imageMedia = getMediaByType(data?.posts, 'image');
  const videoMedia = getMediaByType(data?.posts, 'video');
  const renderMediaGrid = () => {
    const mediaArray = activeTab === 'posts' ? imageMedia : videoMedia;

    if (!mediaArray.length) {
      return (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
            {activeTab === 'posts' ? 'No posts yet' : 'No videos yet'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {mediaArray.map((mediaItem, idx) => (
          <TouchableOpacity
            key={`${mediaItem.postIndex}-${mediaItem.mediaIndex}`}
            style={styles.gridItem}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/SinglePostScreen',
                params: {
                  postId: mediaItem?.postId
                }
              })
            }
          >
            {mediaItem.media_type === 'video' ? (
              <View>
                <Video
                  source={{ uri: mediaItem.url }}
                  style={styles.gridImage}
                  resizeMode="cover"
                  shouldPlay={false}
                  isMuted
                  isLooping={false}
                  useNativeControls={false}
                />
                <View style={styles.playButton}>
                  <Icon name="play" size={24} color="#fff" />
                </View>
              </View>
            ) : (
              <Image
                source={{ uri: mediaItem.url }}
                style={styles.gridImage}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };


  // --- End of hooks and logic ---

  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#ff0000" />
        <Text style={{ color: '#fff', fontSize: 18, marginTop: 16 }}>Loading profile...</Text>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{ }</Text>
          <TouchableOpacity onPress={openBottomSheet}>
            <Icon name="ellipsis-vertical" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ff0000']}
              tintColor={'#ff0000'}
              title="Pull to refresh"
              titleColor={theme.text}
            />
          }
        >
          {/* Profile Info */}
          <View style={styles.profileSection}>
            <Image source={{ uri: data?.user?.profile_picture_url }} style={styles.avatar} />
            <Text style={[styles.name, { color: theme.text }]}>{data?.user.username}</Text>
            <Text style={[styles.bio, { color: theme.textSecondary }]}>{profileData.bio}</Text>

            {/* Stats */}
            <View style={[styles.statsContainer, { backgroundColor: theme.secondary }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.text }]}>
                  {data?.post_count}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Posts</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.statItem} onPress={openFollowersSheet}>
                <Text style={[styles.statNumber, { color: theme.text }]}>
                  {data?.followers_count}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.statItem} onPress={openFollowingSheet}>
                <Text style={[styles.statNumber, { color: theme.text }]}>
                  {data?.following_count}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Following</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            {authUser && authUser?.id != user_id && <View style={styles.actionButtons}>
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

              <TouchableOpacity style={[styles.messageButton, { backgroundColor: theme.Mbtn }]} onPress={() => sendMessageMutation.mutate()}>
                <Text style={[styles.messageButtonText, { color: 'white' }]}>Message</Text>
              </TouchableOpacity>
              {
                data?.is_business &&
                <TouchableOpacity onPress={() => handleListingPress()} style={[styles.messageButton, styles.listingBtn, { backgroundColor: 'transparent' }]}>
                  <Text style={[styles.messageButtonText, { color: "#FF0000" }]}>Listing</Text>
                </TouchableOpacity>
              }
            </View>
            }
            {authUser && authUser?.id == user_id && <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => router.push('/EditProfile')} style={styles.followButton}>
                <Text style={styles.followButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleListingPress()} style={[styles.messageButton, styles.listingBtn, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.messageButtonText, { color: "#FF0000" }]}>Listing</Text>
              </TouchableOpacity>
            </View>}
          </View>

          {/* Tab Navigation */}
          <View style={[styles.tabContainer, { backgroundColor: theme.background }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
              onPress={() => setActiveTab('posts')}
            >
              <Image source={images.profileImages} style={{ width: 20, height: 20, tintColor: activeTab === 'posts' ? theme.text : theme.textSecondary }} />
              <Text style={[styles.tabText, { color: activeTab === 'posts' ? theme.text : theme.textSecondary }]}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
              onPress={() => setActiveTab('videos')}
            >
              <Image source={images.profileVideos} style={{ width: 20, height: 20, tintColor: activeTab === 'videos' ? theme.text : theme.textSecondary }} />
              <Text style={[styles.tabText, { color: activeTab === 'videos' ? theme.text : theme.textSecondary }]}>Videos</Text>
            </TouchableOpacity>
          </View>

          {/* Content Grid */}
          {renderMediaGrid()}
        </ScrollView>

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

            <TouchableOpacity style={styles.bottomSheetOption}>
              <MaterialIcons name="content-copy" size={24} color={theme.text} />
              <Text style={[styles.bottomSheetOptionText, { color: theme.text }]}>Copy profile URL</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomSheetOption}>
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
              <Icon name="warning-outline" size={24} color="#ff4444" />
              <Text style={[styles.bottomSheetOptionText, { color: '#ff4444' }]}>Restrict</Text>
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
              <MaterialIcons name="block" size={24} color="#ff4444" />
              <Text style={[styles.bottomSheetOptionText, { color: '#ff4444' }]}>Block User</Text>
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
    backgroundColor: '#ff4444',
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
    borderBottomColor: '#ff4444',
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
    top: '40%',
    left: '40%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 18,
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
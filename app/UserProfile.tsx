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


const { width } = Dimensions.get('window');
const imageSize = (width - 30) / 3;

// const dark = true; // You can change this to toggle theme

const profileData = {
  name: 'Adewale',
  bio: 'Here to have fun, make friends and stay healthy',
  posts: 50,
  followers: 3255,
  following: 100,
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
};
function getMediaByType(posts, type: 'image' | 'video') {
  if (!Array.isArray(posts)) return [];
  return posts.flatMap((post, postIndex) =>
    (Array.isArray(post.media) ? post.media : [])
      .filter(mediaItem =>
        type === 'image'
          ? mediaItem.media_type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(mediaItem.url)
          : mediaItem.media_type === 'video' || /\.(mp4|mov|avi|webm)$/i.test(mediaItem.url)
      )
      .map((mediaItem, mediaIndex) => ({
        ...mediaItem,
        postIndex,
        mediaIndex,
      }))
  );
}

export default function ProfileScreen() {
  const { dark } = useTheme();
  console.log('Dark Mode:', dark);
  const [activeTab, setActiveTab] = useState('posts');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const followersSheetRef = useRef<BottomSheet>(null);
  const followingSheetRef = useRef<BottomSheet>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const { user_id } = useLocalSearchParams<{ user_id?: any }>();
  console.log('User ID:', user_id);
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');
      return await followUnfollowUser(Number(user_id), token);
    },
    onSuccess: () => {
      console.log('Follow/Unfollow successful');
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
  console.log("prpfo;e data", data);
  const getUserData = async () => {
    return await SecureStore.getItemAsync('user_data');
    // console.log("User data:", user_id);
  };
  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await getUserData();
      if (userData) {
        setAuthUser(JSON.parse(userData));
      }
      console.log("Fetched User Data:", userData);
    };

    fetchUserData();
    console.log("Auth User Data:", authUser);
  }, []);

  const {
    data: followersApiData,
    isLoading: isLoadingFollowers,
  } = useQuery({
    queryKey: ['followers', user_id],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      // Correct order: id first, then token
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
      // Correct order: id first, then token
      return await getFollowingList(Number(user_id), token);
    },
    enabled: !!user_id,
  });
  console.log("follower List is ", followersApiData);
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
        isFollowing: !!user?.is_following_back, // use backend value directly
      };
    });



  const followers = Array.isArray(followersApiData)
    ? mapApiUsers(followersApiData, 'followers')
    : [];

  const following = followingApiData && Array.isArray(followingApiData)
    ? mapApiUsers(followingApiData)
    : [];


  const snapPoints = useMemo(() => ['25%', '50%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
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
    console.log("Passing user_id to UserListing:", user_id);
    router.push({
      pathname: '/UserListing',
      params: { user_id: user_id?.toString() }
    });
  };

  const handleListingPress = () => {
    console.log("Passing user_id to UserListing:", user_id);

    router.push({
      pathname: '/UserListing',
      params: { user_id: user_id?.toString() }
    });
  }

  const handleFollowToggle = (userId: string, isCurrentlyFollowing: boolean) => {
    // Update followers list
    setFollowers(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, isFollowing: !isCurrentlyFollowing }
          : user
      )
    );

    // Update following list
    setFollowing(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, isFollowing: !isCurrentlyFollowing }
          : user
      )
    );
  };

  const handleMediaPress = (index: number) => {
    router.push({
      pathname: '/MediaViewer',
      params: {
        index: index.toString(),
        type: activeTab,
      },
    });
  };

  const theme = {
    background: dark ? '#000000' : '#FAFAFA',
    secondary: dark ? '#181818' : '#f5f5f5',
    text: dark ? '#ffffff' : '#000000',
    textSecondary: dark ? '#999999' : '#666666',
    border: dark ? '#333333' : '#e0e0e0',
    Mbtn: dark ? '#FFFFFF80' : '#000000',
  };
  // const renderPostGrid = () => (
  //   <View style={styles.gridContainer}>
  //     {data?.posts?.map((post, postIndex) =>
  //       post.media.map((mediaItem, mediaIndex) => (
  //         <TouchableOpacity
  //           key={`${postIndex}-${mediaIndex}`}
  //           style={styles.gridItem}
  //           onPress={() => handleMediaPress(postIndex)}
  //           activeOpacity={0.8}
  //         >
  //           <Image
  //             source={{ uri: mediaItem.url }}
  //             style={styles.gridImage}
  //             resizeMode="cover"
  //           />
  //           {mediaItem.media_type === 'video' && (
  //             <View style={styles.playButton}>
  //               <Icon name="play" size={24} color="#ffffff" />
  //             </View>
  //           )}
  //         </TouchableOpacity>
  //       ))
  //     )}
  //   </View>
  // );
  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#ff0000" />
        <Text style={{ color: '#fff', fontSize: 18, marginTop: 16 }}>Loading profile...</Text>
      </GestureHandlerRootView>
    );
  }
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
            onPress={() =>
              router.push({
                pathname: '/MediaViewer',
                params: {
                  index: idx.toString(),
                  type: activeTab,
                  url: mediaItem.url,
                  media_type: mediaItem.media_type,
                  postIndex: mediaItem.postIndex?.toString() ?? '0',
                  mediaIndex: mediaItem.mediaIndex?.toString() ?? '0',
                },
              })
            }
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: mediaItem.url }}
              style={styles.gridImage}
              resizeMode="cover"
            />
            {mediaItem.media_type === 'video' && (
              <View style={styles.playButton}>
                <Icon name="play" size={24} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };
const sendMessageMutation = useMutation({
  mutationFn: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    const userData = await SecureStore.getItemAsync('user_data');
    if (!token || !userData) throw new Error('Auth data missing');

    const parsedUser = JSON.parse(userData);

    const payload: ChatMessagePayload = {
      sender_id: parsedUser.id,
      receiver_id: Number(user_id),
      message: 'Hi, I’d like to connect with you!', // customize or make dynamic
    };

    return await sendChatMessage(payload, token);
  },
  onSuccess: (res) => {
    console.log('Message sent:', res);
    Toast.show({
      type: 'success',
      text1: 'Message sent',
      text2: 'Your message has been sent to the user',
      });
    // Optionally navigate to chat screen here
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: '#FFFFFF' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{ }</Text>
          <TouchableOpacity onPress={openBottomSheet}>
            <Icon name="ellipsis-vertical" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
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

              <TouchableOpacity style={[styles.messageButton, { backgroundColor: theme.Mbtn }]}  onPress={() => sendMessageMutation.mutate()}>
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

            <TouchableOpacity style={styles.bottomSheetOption}>
              <Icon name="warning-outline" size={24} color="#ff4444" />
              <Text style={[styles.bottomSheetOptionText, { color: '#ff4444' }]}>Restrict</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomSheetOption}>
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
          onFollowToggle={handleFollowToggle}
          onClose={() => followersSheetRef.current?.close()}
          loading={isLoadingFollowers}
          emptyText="No followers found."
        />

        {/* Following Bottom Sheet */}
        <FollowingBottomSheet
          ref={followingSheetRef}
          users={following}
          title="Following"
          count={Array.isArray(following) ? following.length : 0}
          dark={dark}
          onFollowToggle={handleFollowToggle}
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
    marginTop: 30,
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
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
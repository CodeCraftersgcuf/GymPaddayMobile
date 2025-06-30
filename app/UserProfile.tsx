import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons as Icon, MaterialIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import FollowersBottomSheet, { User } from '@/components/Social/post/FollowersBottomSheet';
import FollowingBottomSheet from '@/components/Social/post/FollowingBottomSheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { images } from '@/constants';
import { useLocalSearchParams } from 'expo-router';


//Code Related to the integration
import { useQuery } from '@tanstack/react-query';
import { fetchUserProfile } from '@/utils/queries/profile';
import * as SecureStore from 'expo-secure-store';


const { width } = Dimensions.get('window');
const imageSize = (width - 30) / 3;

const dark = true; // You can change this to toggle theme

const profileData = {
  name: 'Adewale',
  bio: 'Here to have fun, make friends and stay healthy',
  posts: 50,
  followers: 3255,
  following: 100,
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
};

const postImages = [
  'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
  'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg',
  'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
  'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg',
  'https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg',
  'https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg',
  'https://images.pexels.com/photos/1552103/pexels-photo-1552103.jpeg',
  'https://images.pexels.com/photos/1552245/pexels-photo-1552245.jpeg',
  'https://images.pexels.com/photos/1552238/pexels-photo-1552238.jpeg',
];

// Sample followers data
const followersData: User[] = [
  { id: '1', name: 'Adewale', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: false },
  { id: '2', name: 'Sasha', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: true },
  { id: '3', name: 'Walexy mo', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: true },
  { id: '4', name: 'AAKCW C12', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: false },
  { id: '5', name: 'Samba simo', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: false },
  { id: '6', name: 'Racket 123', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: false },
  { id: '7', name: 'Biling 23_', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: false },
  { id: '8', name: 'LAQWX12', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: false },
  { id: '9', name: 'Asder', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: false },
  { id: '10', name: 'Friday', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: false },
  { id: '11', name: 'Chris23345', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: false },
];

// Sample following data
const followingData: User[] = [
  { id: '1', name: 'Adewale', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: false },
  { id: '2', name: 'Sasha', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: true },
  { id: '3', name: 'Walexy mo', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: true },
  { id: '4', name: 'AAKCW C12', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: false },
  { id: '5', name: 'Samba simo', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', isFollowing: false },
];

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('posts');
  const [followers, setFollowers] = useState<User[]>(followersData);
  const [following, setFollowing] = useState<User[]>(followingData);
  const { user_id } = useLocalSearchParams<{ user_id?: any }>();
  console.log('User ID:', user_id);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const followersSheetRef = useRef<BottomSheet>(null);
  const followingSheetRef = useRef<BottomSheet>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['userProfile', user_id],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      return await fetchUserProfile(token, Number(user_id));
    },
    enabled: !!user_id,
  });

  console.log("User Profile Data:", data);

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
    router.push('/UserListing');
  };

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
    background: dark ? '#000000' : '#ffffff',
    secondary: dark ? '#181818' : '#f5f5f5',
    text: dark ? '#ffffff' : '#000000',
    textSecondary: dark ? '#999999' : '#666666',
    border: dark ? '#333333' : '#e0e0e0',
  };
const renderPostGrid = () => (
  <View style={styles.gridContainer}>
    {data?.posts?.map((post, postIndex) =>
      post.media.map((mediaItem, mediaIndex) => (
        <TouchableOpacity
          key={`${postIndex}-${mediaIndex}`}
          style={styles.gridItem}
          onPress={() => handleMediaPress(postIndex)}
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
      ))
    )}
  </View>
);


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Icon name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{}</Text>
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
                <Text style={[styles.statNumber, { color: theme.text }]}>{data?.post_count}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Posts</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.statItem} onPress={openFollowersSheet}>
                <Text style={[styles.statNumber, { color: theme.text }]}>{data?.followers_count.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.statItem} onPress={openFollowingSheet}>
                <Text style={[styles.statNumber, { color: theme.text }]}>{data?.post_count}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Following</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            {false && <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.messageButton, { backgroundColor: theme.secondary }]}>
                <Text style={[styles.messageButtonText, { color: theme.text }]}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/UserListing')} style={[styles.messageButton, styles.listingBtn, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.messageButtonText, { color: "#FF0000" }]}>Listing</Text>
              </TouchableOpacity>
            </View>
            }
            {true && <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => router.push('/EditProfile')} style={styles.followButton}>
                <Text style={styles.followButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/UserListing')} style={[styles.messageButton, styles.listingBtn, { backgroundColor: 'transparent' }]}>
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
          {renderPostGrid()}
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
          count={profileData.followers}
          dark={dark}
          onFollowToggle={handleFollowToggle}
          onClose={() => followersSheetRef.current?.close()}
        />

        {/* Following Bottom Sheet */}
        <FollowingBottomSheet
          ref={followingSheetRef}
          users={following}
          title="Following"
          count={profileData.following}
          dark={dark}
          onFollowToggle={handleFollowToggle}
          onClose={() => followingSheetRef.current?.close()}
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
    borderBottomWidth: 1,
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
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 16,
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
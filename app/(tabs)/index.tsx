import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';

import StoryContainer from '@/components/Social/StoryContainer';
import PostContainer from '@/components/Social/PostContainer';
import CommentsBottomSheet from '@/components/Social/CommentsBottomSheet';
import { mockStories, mockPosts } from '@/components/Social/mockData';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabHeader from '@/components/Social/TabHeader';
import FloatingActionButton from '@/components/Social/FloatingActionButton';
import { useTheme } from '@/contexts/themeContext';
import PostDetailBottomsheet from '@/components/Social/PostDetailBottomsheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';

export default function SocialFeedScreen() {
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentComments, setCurrentComments] = useState<any[]>([]);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const { dark } = useTheme();
  const route = useRouter();

  const handleCommentPress = (comments: any[], postId: number) => {
    setCurrentComments(comments);
    setCurrentPostId(postId);
    setCommentModalVisible(true);
  };

  const handleCloseComments = () => {
    setCommentModalVisible(false);
  };
  const handleAddComment = (text: string, postId: number) => {
    // Create new comment
    const newComment = {
      id: Math.random().toString(),
      userId: 'current-user-id',
      username: 'You',
      profileImage: 'https://randomuser.me/api/portraits/men/45.jpg',
      text: text,
      timestamp: '1 min',
      likes: 0,
      replies: []
    };
    setCurrentComments(prevComments => [...prevComments, newComment]);
    console.log('Adding comment to post:', postId, text);
  };

  const handleStartLive = () => {
    route.push('/goLive')
    console.log('Start live streaming');
  };

  const handleCreatePost = () => {
    console.log('Create new post');
    // route.push('/create-post');
  };
  const [BottomIndex, setBottomIndex] = useState(-1);
  const [PostType, setPostType] = useState('ViewerPost');
  const handleMenu = (userId: any, postId: any) => {
    setPostType(userId == 100 ? 'userpost' : 'ViewerPost');
    setBottomIndex(1);
    console.log('click bottom sheet', userId, postId);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Header */}
        <TabHeader
          title="Socials"
          admin={{ profile: "https://randomuser.me/api/portraits/men/45.jpg", userId: '12345' }}
          notificationID="notif123"
        />

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Main Content */}
          {/* Stories */}
          <StoryContainer stories={mockStories} />

          {/* Posts */}
          <PostContainer
            posts={mockPosts}
            onCommentPress={handleCommentPress}
            handleMenu={handleMenu}
          />
        </ScrollView>

        {/* Comments Bottom Sheet */}
        <CommentsBottomSheet
          visible={commentModalVisible}
          comments={currentComments}
          postId={currentPostId}
          onClose={handleCloseComments}
          onAddComment={handleAddComment}
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
    color: '#ff0000',
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
    backgroundColor: '#ff0000', // Red background for the button
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Shadow for Android
    shadowColor: '#ff0000', // Shadow color for iOS
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
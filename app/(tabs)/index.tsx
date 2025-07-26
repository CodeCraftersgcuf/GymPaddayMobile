import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  ActivityIndicator, // <-- add this
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

import { useQuery } from '@tanstack/react-query';
import { getUserPosts } from '@/utils/queries/posts';
import * as SecureStore from 'expo-secure-store';
import { getPostComments } from '@/utils/queries/comments';
import { useMutation } from '@tanstack/react-query';
import { createComment } from '@/utils/mutations/comments';
import { groupStoriesByUser } from '@/utils/groupStories';
import { GroupedUserStories, StoryItem } from '@/utils/types/story';

// LoadingIndicator component
function LoadingIndicator({ text = "Loading..." }) {
  const { dark } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: dark ? '#000' : '#fff' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ActivityIndicator size="large" color="#ff0000" />
      <Text style={{ color: dark ? '#fff' : '#000', fontSize: 18, marginTop: 16 }}>{text}</Text>
    </View>
  );
}

export default function SocialFeedScreen() {
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentComments, setCurrentComments] = useState<any[]>([]);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
  const [idCan, setidCan] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const { dark } = useTheme();
  const route = useRouter();
  const [posts, setPosts] = useState<PostData[]>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['userPosts'],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      const response = await getUserPosts(token);
      return response; // ← this will be in `data`
    },
  });
  const [groupedStories, setGroupedStories] = useState<GroupedUserStories[]>([]);
  const [loading, setLoading] = useState(true);
  const getToken = async () => {
    return await SecureStore.getItemAsync('auth_token');
  }
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch(`https://gympaddy.hmstech.xyz/api/user/get/stories`, {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        });

        const json = await response.json();
        // const stories: StoryItem[] = json.stories;
        const { stories = [], my_stories = [] } = json;

        const groupedStories = groupStoriesByUser(stories); // stories from followed users
        const myGroupedStories = groupStoriesByUser(my_stories); // your stories (ideally just one user)

        setGroupedStories([
          ...myGroupedStories, // show your story first
          ...groupedStories,
        ]);

        // setGroupedStories(grouped);
      } catch (err) {
        console.error('Error fetching stories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);
  // Query for comments (enabled only when modal visible and postId set)
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

  const {
    mutate: addComment,
    isPending: isAddingComment,
    error: addCommentError
  } = useMutation({
    mutationFn: async ({ text, postId }) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error("No token");
      return createComment({
        data: { post_id: postId, content: text },
        token
      });
    },
    onSuccess: async (res, variables) => {
      // Optionally: refetch comments after adding
      await refetchComments();
    }
  });


  useEffect(() => {
    if (data && data.data) {
      const postsArray = data.data; // ← this is the array of posts

      const formatted = postsArray.map((post: any) => ({
        id: post.id,
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
        recent_comments: post.comments?.slice(0, 2).map((comment: any) => ({
          id: comment.id,
          user: {
            username: comment.user?.username || 'Unknown',
            profile_picture: comment.user?.profile_picture_url || '',
          },
          text: comment.content || '',
        })) || [],
      }));

      // console.log('✅ Formatted posts', formatted);
      setPosts(formatted);
    }
  }, [data]);



  const handleCommentPress = (comments: any[], postId: number) => {
    setCurrentPostId(postId);
    setCommentModalVisible(true);
    refetchComments();
  };

  const handleCloseComments = () => {
    setCommentModalVisible(false);
    setCurrentPostId(null);
  };

  const handleAddComment = (text: string, postId: number) => {
    // Call the mutation
    addComment({ text, postId });

    console.log('Adding comment to post:', postId, text);
  };


  const handleStartLive = () => {
    route.push('/goLive');
  };

  const handleCreatePost = () => {
    route.push('/createpost');
  };

  const [BottomIndex, setBottomIndex] = useState(-1);
  const [PostType, setPostType] = useState('ViewerPost');

  const handleMenu = (userId: any, postId: any) => {
    setPostType(userId == 100 ? 'userpost' : 'ViewerPost');
    setBottomIndex(1);
    setidCan({ userId, postId });
    console.log('click bottom sheet', userId, postId);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Show loading indicator while user posts are loading
  if (isLoading) {
    return <LoadingIndicator text="Loading posts..." />;
  }

  const handleHidePost = () => {
    console.log('Hiding post:', idCan);
    setBottomIndex(-1); // Close the bottom sheet

    if (idCan.postId) {
      setPosts(prev => prev.filter(p => p.id !== idCan.postId));
      setBottomIndex(-1); // Close the bottom sheet
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


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: dark ? 'black' : 'white' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        <TabHeader
          title="Socials"
          admin={{ profile: "https://randomuser.me/api/portraits/men/45.jpg", userId: '12345' }}
          notificationID="notif123"
        />

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ff0000']}
              tintColor={'#ff0000'}
              title="Pull to refresh"
              titleColor={dark ? '#ffffff' : '#000000'}
            />
          }
        >
          <StoryContainer stories={groupedStories ?? []} />
          <PostContainer
            posts={posts}
            onCommentPress={handleCommentPress}
            handleMenu={handleMenu}
          />
        </ScrollView>
        <CommentsBottomSheet
          visible={commentModalVisible}
          comments={mapApiCommentsToInternal(commentData)}
          postId={currentPostId}
          onClose={handleCloseComments}
          onAddComment={handleAddComment}
          loading={isLoadingComments || isAddingComment}
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
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, StatusBar, ScrollView } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams } from 'expo-router';
import PostItem from '@/components/Social/PostItem';
import CommentsBottomSheet from '@/components/Social/CommentsBottomSheet';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getPostComments } from '@/utils/queries/comments';
import { createComment } from '@/utils/mutations/comments';
import { API_ENDPOINTS } from '@/apiConfig';
import { useFocusEffect } from '@react-navigation/native';

export default function SinglePostScreen() {
  const params = useLocalSearchParams<{ postId?: string | string[] }>();
  const postIdRaw = params.postId;
  const postId =
    postIdRaw === undefined ? undefined : Array.isArray(postIdRaw) ? postIdRaw[0] : postIdRaw;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);

  const getToken = async () => {
    const storedToken = await SecureStore.getItemAsync('auth_token');
    setToken(storedToken);
  };

  useEffect(() => {
    getToken();
  }, []);

  const {
    data: commentData,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['postComments', postId],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token || !postId) throw new Error('No token or postId');
      return getPostComments(token, Number(postId));
    },
    enabled: !!postId && commentModalVisible,
  });

  const {
    mutate: addComment,
    isPending: isAddingComment,
  } = useMutation({
    mutationFn: async ({ text, postId }) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No token');
      return createComment({
        data: { post_id: postId, content: text },
        token,
      });
    },
    onSuccess: async () => {
      await refetchComments();
    },
  });

  const mapApiCommentsToInternal = (apiComments: any[]): Comment[] => {
    return (apiComments || []).map((item) => ({
      id: item.id.toString(),
      userId: item.user?.id?.toString() || '',
      username: item.user?.username || 'Unknown',
      profileImage: item.user?.profile_picture_url || '',
      text: item.content || '',
      timestamp: item.created_at,
      likes: 0,
      replies: mapApiCommentsToInternal(item.replies || []),
    }));
  };

  const fetchPost = useCallback(async () => {
    const t = token ?? (await SecureStore.getItemAsync('auth_token'));
    if (!t || !postId) {
      setLoading(false);
      return;
    }
    try {
      const url = API_ENDPOINTS.USER.POSTS.Show(Number(postId));
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${t}` },
      });

      const rawPost = response.data;

      const parsedPost = {
        id: rawPost.id,
        content: rawPost.content,
        timestamp: rawPost.created_at,
        likes_count: rawPost.likes?.length || 0,
        comments_count: rawPost.all_comments_count || 0,
        user: {
          id: rawPost.user.id,
          username: rawPost.user.username,
          profile_picture: rawPost.user.profile_picture_url,
        },
        imagesUrl: rawPost.media?.filter((m: any) => m.media_type === 'image').map((m: any) => m.url) || [],
        videoUrl: rawPost.media?.find((m: any) => m.media_type === 'video')?.url || null,
        recent_comments: rawPost.comments || [],
        share_count: 0,
        view_count: 0,
      };

      setPost(parsedPost);
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  }, [token, postId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPost();
    }, [fetchPost])
  );

  const handleCommentPress = (comments: any[], postId: number) => {
    setCommentModalVisible(true);
    refetchComments();
  };

  const handleAddComment = (text: string, postId: number) => {
    addComment({ text, postId });
  };

  const handleMenu = (userId: number, postId: number) => {
    console.log('Top menu pressed', userId, postId);
    // optionally open a bottomsheet or action sheet
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ActivityIndicator size="large" color="#940304" />
        <Text style={{ color: '#000', marginTop: 10 }}>Loading post...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text>Post not found</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
        <View style={[{backgroundColor:'white',marginTop:100}]}>

      <PostItem
        post={post}
        onCommentPress={() => handleCommentPress(post.recent_comments, post.id)}
        handleMenu={handleMenu}
      />

      <CommentsBottomSheet
        visible={commentModalVisible}
        comments={mapApiCommentsToInternal(commentData)}
        postId={Number(postId)}
        onClose={() => setCommentModalVisible(false)}
        onAddComment={handleAddComment}
        loading={isLoadingComments || isAddingComment}
      />
              </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    height:'100%',
    backgroundColor: '#fff',
    // alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

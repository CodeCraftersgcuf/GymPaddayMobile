import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, StatusBar, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams } from 'expo-router';
import PostItem from '@/components/Social/PostItem';
import CommentsBottomSheet from '@/components/Social/CommentsBottomSheet';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getPostComments } from '@/utils/queries/comments';
import { createComment } from '@/utils/mutations/comments';
import { getPostById } from '@/utils/queries/posts';
import { mapPostFromApi } from '@/utils/mapFeedPost';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { STALE_TIMES } from '@/utils/queryClient';
import { findRawPostInAppCache, postQueryKey } from '@/utils/postCache';

const { width } = Dimensions.get('window');

export default function SinglePostScreen() {
  const { postId, videoThumbnail } = useLocalSearchParams<{
    postId?: string;
    videoThumbnail?: string;
  }>();
  const numericPostId = Number(postId);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const cachedPost = findRawPostInAppCache(numericPostId);

  const {
    data: rawPost,
    isLoading,
    isError,
  } = useQuery({
    queryKey: postQueryKey(numericPostId),
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token || !numericPostId) throw new Error('No token or postId');
      return getPostById(numericPostId, token);
    },
    enabled: !!numericPostId,
    initialData: cachedPost,
    placeholderData: cachedPost,
    staleTime: STALE_TIMES.feed,
  });

  const post = useMemo(() => {
    if (!rawPost) return null;
    const mapped = mapPostFromApi(rawPost);
    if (videoThumbnail && !mapped.videoThumbnailUrl) {
      mapped.videoThumbnailUrl = resolveMediaUrl(String(videoThumbnail));
    }
    return mapped;
  }, [rawPost, videoThumbnail]);

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
      profileImage: resolveMediaUrl(item.user?.profile_picture_url) || '',
      text: item.content || '',
      timestamp: item.created_at,
      likes: 0,
      replies: mapApiCommentsToInternal(item.replies || []),
    }));
  };

  const handleCommentPress = (comments: any[], postId: number) => {
    setCommentModalVisible(true);
    refetchComments();
  };

  const handleAddComment = (text: string, postId: number) => {
    addComment({ text, postId });
  };

  const handleMenu = (userId: number, postId: number) => {
    console.log('Top menu pressed', userId, postId);
  };

  if (isLoading && !post) {
    const thumbUri = videoThumbnail ? resolveMediaUrl(String(videoThumbnail)) : null;
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        {thumbUri ? (
          <Image
            source={{ uri: thumbUri }}
            style={styles.loadingPoster}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <>
            <ActivityIndicator size="large" color="#940304" />
            <Text style={{ color: '#000', marginTop: 10 }}>Loading post...</Text>
          </>
        )}
      </View>
    );
  }

  if (!post && !isLoading) {
    return (
      <View style={styles.center}>
        <Text>{isError ? 'Failed to load post' : 'Post not found'}</Text>
      </View>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.postWrap}>
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
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  postWrap: {
    backgroundColor: '#fff',
    paddingTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingPoster: {
    width: width - 20,
    height: width - 20,
    borderRadius: 18,
  },
});

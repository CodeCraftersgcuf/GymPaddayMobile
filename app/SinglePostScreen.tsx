import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  StatusBar,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons as Icon } from '@expo/vector-icons';
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
import { useSafeBack } from '@/utils/hooks/useSafeBack';
import { useTheme } from '@/contexts/themeContext';

const { width } = Dimensions.get('window');

export default function SinglePostScreen() {
  const { dark } = useTheme();
  const goBack = useSafeBack();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, StatusBar.currentHeight ?? 0, 12);
  const { postId, videoThumbnail } = useLocalSearchParams<{
    postId?: string;
    videoThumbnail?: string;
  }>();
  const numericPostId = Number(postId);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const cachedPost = findRawPostInAppCache(numericPostId);

  const bg = dark ? '#000000' : '#FFFFFF';
  const textColor = dark ? '#FFFFFF' : '#000000';

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
    mutationFn: async ({ text, postId }: { text: string; postId: number }) => {
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

  const mapApiCommentsToInternal = (apiComments: any[]): any[] => {
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

  const handleCommentPress = () => {
    setCommentModalVisible(true);
    refetchComments();
  };

  const handleAddComment = (text: string, postId: number) => {
    addComment({ text, postId });
  };

  const handleMenu = (_userId: number, _postId: number) => {};

  const header = (
    <View
      style={[
        styles.header,
        {
          backgroundColor: bg,
          borderBottomColor: dark ? '#222' : '#EFEFEF',
          paddingTop: topPad,
        },
      ]}
    >
      <TouchableOpacity onPress={goBack} hitSlop={12} style={styles.backBtn} accessibilityLabel="Go back">
        <Icon name="chevron-back" size={26} color={textColor} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: textColor }]}>Post</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (isLoading && !post) {
    const thumbUri = videoThumbnail ? resolveMediaUrl(String(videoThumbnail)) : null;
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['left', 'right']}>
        <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
        {header}
        <View style={styles.center}>
          {thumbUri ? (
            <Image
              source={{ uri: thumbUri }}
              style={styles.loadingPoster}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <>
              <ActivityIndicator size="large" color="#C61F3A" />
              <Text style={{ color: textColor, marginTop: 10 }}>Loading post...</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (!post && !isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['left', 'right']}>
        <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
        {header}
        <View style={styles.center}>
          <Text style={{ color: textColor }}>
            {isError ? 'Failed to load post' : 'Post not found'}
          </Text>
          <TouchableOpacity onPress={goBack} style={styles.fallbackBack}>
            <Text style={styles.fallbackBackText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['left', 'right']}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      {header}
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bg }]}>
        <View style={[styles.postWrap, { backgroundColor: bg }]}>
          <PostItem
            post={post}
            onCommentPress={handleCommentPress}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  container: {
    flexGrow: 1,
  },
  postWrap: {
    paddingTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingPoster: {
    width: width - 20,
    height: width - 20,
    borderRadius: 18,
  },
  fallbackBack: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#C61F3A',
  },
  fallbackBackText: {
    color: '#fff',
    fontWeight: '600',
  },
});

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { CachedAvatar } from '@/components/media/CachedImage';
import { navigateToUserProfile } from '@/utils/navigateToProfile';
import { getLikenDislikePost, createShare } from '@/utils/queries/socialMedia';
import { useLikeState, getLikeEntry } from '@/utils/likeStore';
import type { FeedPostVideo } from '@/contexts/FeedVideoPoolContext';

function formatCount(n?: number): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

type ReelsActionRailProps = {
  post: FeedPostVideo;
  onOpenComments: (postId: number) => void;
  onOpenMore: (post: FeedPostVideo) => void;
  commentsCount?: number;
};

function ReelsActionRailComponent({
  post,
  onOpenComments,
  onOpenMore,
  commentsCount,
}: ReelsActionRailProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [shareCount, setShareCount] = useState(post.share_count ?? 0);
  const [liking, setLiking] = useState(false);

  // Shared like state keeps the reels rail in sync with the feed. The feed list
  // endpoint returns an authoritative `likes_count` but an empty `likes` array,
  // so seed the count from likes_count (using || so an empty array falls back).
  const { liked: isLiked, count: likesCount, setLike } = useLikeState(
    post.id,
    Boolean(post.is_liked),
    post.likes_count || post.likes?.length || 0,
  );

  useEffect(() => {
    SecureStore.getItemAsync('auth_token').then(setToken);
  }, []);

  useEffect(() => {
    setShareCount(post.share_count ?? 0);
  }, [post.id, post.share_count]);

  // Seed the shared store if the payload happens to include the current user in
  // its likes array and nothing has been recorded yet.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!post.likes || post.likes.length === 0 || getLikeEntry(post.id)) return;
        const userData = await SecureStore.getItemAsync('user_data');
        if (!userData) return;
        const currentUser = JSON.parse(userData);
        const liked = post.likes.some((like) => like.user?.id === currentUser.id);
        if (liked && !cancelled) {
          setLike(true, post.likes_count || post.likes.length || 0);
        }
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post.id, post.likes, post.likes_count, setLike]);

  const handleLike = useCallback(async () => {
    if (!token || liking) return;
    const newLiked = !isLiked;
    setLike(newLiked, likesCount + (newLiked ? 1 : -1));
    setLiking(true);
    try {
      const res = await getLikenDislikePost(post.id, token);
      // Server is authoritative: it returns { message: 'Disliked' } when the
      // like was toggled off, otherwise the created like. Reconcile in case our
      // optimistic guess (based on an empty likes array) was wrong.
      const serverLiked = !(res && res.message === 'Disliked');
      if (serverLiked !== newLiked) {
        setLike(serverLiked, likesCount + (serverLiked ? 1 : -1));
      }
    } catch (error) {
      setLike(isLiked, likesCount);
      console.error('Reels like error:', error);
    } finally {
      setLiking(false);
    }
  }, [token, liking, isLiked, likesCount, post.id, setLike]);

  const handleShare = useCallback(async () => {
    try {
      const firstImage = post.imagesUrl?.[0];
      const message = `${post.content || 'Check out this post!'}${firstImage ? `\n${firstImage}` : ''}`;
      const result = await Share.share({ message, title: 'Check out this post!' });
      if (result.action === Share.sharedAction && token) {
        setShareCount((prev) => prev + 1);
        createShare(
          { shareable_id: post.id, shareable_type: 'App\\Models\\Post' },
          token,
        ).catch(() => {});
      }
    } catch {
      /* noop */
    }
  }, [post.content, post.imagesUrl, post.id, token]);

  const handleAvatarPress = useCallback(() => {
    if (post.user?.id == null) return;
    navigateToUserProfile(router, {
      user_id: post.user.id as any,
      username: post.user.username,
      profile_picture: post.user.profile_picture || undefined,
    });
  }, [router, post.user]);

  return (
    <View style={styles.rail} pointerEvents="box-none">
      <TouchableOpacity style={styles.avatarWrap} onPress={handleAvatarPress} activeOpacity={0.8}>
        <CachedAvatar uri={post.user?.profile_picture} size={46} borderWidth={2} borderColor="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.action} onPress={handleLike} activeOpacity={0.7}>
        <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={34} color={isLiked ? '#ff2d55' : '#fff'} />
        <Text style={styles.count}>{formatCount(likesCount)}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.action} onPress={() => onOpenComments(post.id)} activeOpacity={0.7}>
        <Ionicons name="chatbubble-outline" size={31} color="#fff" />
        <Text style={styles.count}>{formatCount(commentsCount ?? post.comments_count)}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.action} onPress={handleShare} activeOpacity={0.7}>
        <Ionicons name="arrow-redo-outline" size={32} color="#fff" />
        <Text style={styles.count}>{formatCount(shareCount)}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.action} onPress={() => onOpenMore(post)} activeOpacity={0.7}>
        <Ionicons name="ellipsis-vertical" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    right: 10,
    bottom: 90,
    alignItems: 'center',
    zIndex: 20,
  },
  avatarWrap: {
    marginBottom: 22,
  },
  action: {
    alignItems: 'center',
    marginBottom: 20,
  },
  count: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
  },
});

export default React.memo(ReelsActionRailComponent);

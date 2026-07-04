import * as SecureStore from 'expo-secure-store';
import { queryClient, STALE_TIMES } from '@/utils/queryClient';
import { getUserPosts, getPostById } from '@/utils/queries/posts';
import { fetchGroupedStories } from '@/utils/storiesApi';
import { fetchConnectedUsers, fetchChatMessages } from '@/utils/queries/chat';
import { getMarketplaceListings } from '@/utils/queries/marketplace';
import { fetchUserProfile } from '@/utils/queries/profile';
import { getNextFeedPage } from '@/utils/feedPagination';
import { findRawPostInAppCache, postQueryKey, seedPostCache } from '@/utils/postCache';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { prefetchVideoForPostId, prefetchVideoFromRawPost } from '@/utils/videoPrefetch';
import { Image } from 'expo-image';
import type { Router } from 'expo-router';

function thumbnailFromRawPost(post: any): string | undefined {
  const video = post?.media?.find((m: any) => m.media_type === 'video');
  if (!video) return undefined;
  return resolveMediaUrl(video.thumbnail_url || video.thumbnail) ?? undefined;
}

export async function prefetchFeedPages(pages = 4): Promise<void> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  await queryClient.prefetchInfiniteQuery({
    queryKey: ['userPosts'],
    initialPageParam: 1,
    staleTime: STALE_TIMES.feed,
    queryFn: ({ pageParam = 1 }) => getUserPosts(token, pageParam),
    getNextPageParam: getNextFeedPage,
    pages,
  });
}

export async function prefetchStories(): Promise<void> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  await queryClient.prefetchQuery({
    queryKey: ['groupedStories'],
    staleTime: STALE_TIMES.stories,
    queryFn: () => fetchGroupedStories(token),
  });
}

export async function prefetchMarketplace(): Promise<void> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  await queryClient.prefetchQuery({
    queryKey: ['marketplace-listings'],
    staleTime: STALE_TIMES.market,
    queryFn: () => getMarketplaceListings(token),
  });
}

export async function prefetchConversations(): Promise<void> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  await queryClient.prefetchQuery({
    queryKey: ['conversations'],
    staleTime: STALE_TIMES.conversations,
    queryFn: () => fetchConnectedUsers(token),
  });
}

export async function prefetchChatMessagesForTopConversations(limit = 3): Promise<void> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  let conversations = queryClient.getQueryData<any>(['conversations'])?.conversations;
  if (!Array.isArray(conversations) || conversations.length === 0) {
    const fresh = await fetchConnectedUsers(token);
    conversations = fresh?.conversations ?? [];
  }

  await Promise.allSettled(
    conversations.slice(0, limit).map((conv: any) =>
      queryClient.prefetchQuery({
        queryKey: ['chatMessages', String(conv.conversation_id)],
        queryFn: () => fetchChatMessages(token, conv.conversation_id),
        staleTime: 30 * 1000,
      }),
    ),
  );
}

export async function prefetchUserProfilePages(
  userId: string | number,
  pages = 2,
): Promise<void> {
  const id = Number(userId);
  if (!id) return;

  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  await queryClient.prefetchInfiniteQuery({
    queryKey: ['userProfile', String(id)],
    initialPageParam: 1,
    staleTime: STALE_TIMES.profile,
    queryFn: ({ pageParam = 1 }) => fetchUserProfile(token, id, pageParam, 9),
    getNextPageParam: (lastPage) =>
      lastPage?.posts_pagination?.has_more
        ? lastPage.posts_pagination.current_page + 1
        : undefined,
    pages,
  });
}

export async function prefetchPost(postId: number): Promise<void> {
  if (!postId) return;

  const cached = findRawPostInAppCache(postId);
  if (cached) {
    seedPostCache(cached);
    prefetchVideoFromRawPost(cached);
    return;
  }

  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  await queryClient.prefetchQuery({
    queryKey: postQueryKey(postId),
    queryFn: async () => {
      const post = await getPostById(postId, token);
      prefetchVideoFromRawPost(post);
      return post;
    },
    staleTime: STALE_TIMES.feed,
  });
}

/** Open a single post — uses feed/profile cache for instant render, fetches in background if needed. */
export function openSinglePost(
  router: Router,
  postId: number,
  opts?: { videoThumbnailUrl?: string },
): void {
  const cached = findRawPostInAppCache(postId);
  if (cached) {
    seedPostCache(cached);
    prefetchVideoFromRawPost(cached);
  } else {
    prefetchPost(postId).catch(() => {});
  }

  const videoThumbnail =
    opts?.videoThumbnailUrl || (cached ? thumbnailFromRawPost(cached) : undefined);
  if (videoThumbnail) {
    Image.prefetch(videoThumbnail).catch(() => {});
  }
  prefetchVideoForPostId(postId);

  router.push({
    pathname: '/SinglePostScreen',
    params: {
      postId: String(postId),
      ...(videoThumbnail ? { videoThumbnail } : {}),
    },
  });
}

export type PrefetchTab = 'index' | 'market' | 'chat';

/** Warm cache before a tab screen mounts (tab press / navigation). */
export async function prefetchTabData(tab: PrefetchTab): Promise<void> {
  switch (tab) {
    case 'index':
      await Promise.allSettled([prefetchFeedPages(4), prefetchStories()]);
      break;
    case 'market':
      await prefetchMarketplace();
      break;
    case 'chat':
      await Promise.allSettled([
        prefetchConversations(),
        prefetchChatMessagesForTopConversations(3),
      ]);
      break;
  }
}

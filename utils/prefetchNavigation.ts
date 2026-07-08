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
import {
  prefetchVideoForPostId,
  prefetchVideoFromRawPost,
  getReelsPrefetchAhead,
} from '@/utils/videoPrefetch';
import { Image } from 'expo-image';
import type { Router } from 'expo-router';
import { getMediaBudgets } from '@/utils/networkQuality';
import { warmFeedVideosFromCache } from '@/utils/mediaWarm';

function thumbnailFromRawPost(post: any): string | undefined {
  const video = post?.media?.find((m: any) => m.media_type === 'video');
  if (!video) return undefined;
  return resolveMediaUrl(video.thumbnail_url || video.thumbnail) ?? undefined;
}

export async function prefetchFeedPages(pages = 1): Promise<void> {
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

  warmFeedVideosFromCache(getReelsPrefetchAhead());
}

export async function prefetchStories(): Promise<void> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  await queryClient.prefetchQuery({
    queryKey: ['groupedStories'],
    staleTime: STALE_TIMES.stories,
    queryFn: () => fetchGroupedStories(token),
  });

  const { prefetchStoriesFromCache } = await import('@/utils/storyPrefetch');
  prefetchStoriesFromCache();
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

export async function prefetchChatMessagesForTopConversations(limit?: number): Promise<void> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  const threadLimit = limit ?? getMediaBudgets().prefetchChatThreads;
  if (threadLimit <= 0) return;

  let conversations = queryClient.getQueryData<any>(['conversations'])?.conversations;
  if (!Array.isArray(conversations) || conversations.length === 0) {
    const fresh = await fetchConnectedUsers(token);
    conversations = fresh?.conversations ?? [];
  }

  await Promise.allSettled(
    conversations.slice(0, threadLimit).map((conv: any) =>
      queryClient.prefetchQuery({
        queryKey: ['chatMessages', String(conv.conversation_id)],
        queryFn: async () => {
          try {
            return await fetchChatMessages(token, conv.conversation_id);
          } catch (err: any) {
            if (err?.statusCode === 403 || err?.statusCode === 401) {
              return { messages: [] };
            }
            throw err;
          }
        },
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

export async function prefetchTabData(tab: PrefetchTab): Promise<void> {
  const budgets = getMediaBudgets();
  switch (tab) {
    case 'index':
      await Promise.allSettled([
        prefetchFeedPages(Math.max(1, budgets.prefetchFeedPagesOnBoot)),
        prefetchStories(),
      ]);
      break;
    case 'market':
      await prefetchMarketplace();
      break;
    case 'chat':
      await Promise.allSettled([
        prefetchConversations(),
        prefetchChatMessagesForTopConversations(budgets.prefetchChatThreads),
      ]);
      break;
  }
}

import * as SecureStore from 'expo-secure-store';
import { queryClient } from '@/utils/queryClient';
import { flushQueryCache } from '@/utils/queryPersistence';
import { UNREAD_MESSAGES_QUERY_KEY } from '@/utils/queries/chat';
import { API_ENDPOINTS } from '@/apiConfig';
import {
  prefetchFeedPages,
  prefetchStories,
  prefetchConversations,
  prefetchMarketplace,
  prefetchUserProfilePages,
  prefetchChatMessagesForTopConversations,
} from '@/utils/prefetchNavigation';
import { warmAllMediaFromCache } from '@/utils/mediaWarm';
import { prefetchStoryMusicLibrary } from '@/utils/storyMusicApi';

export type PreloadOptions = {
  /** Max wait during cold boot splash (ms). Default 8000. */
  timeoutMs?: number;
  /** Persist cache to disk after preload. Default true on cold boot. */
  persistAfter?: boolean;
};

async function fetchUnreadCount(token: string): Promise<number> {
  const res = await fetch(API_ENDPOINTS.USER.CHAT_MESSAGES.UnreadCount, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return 0;
  const json = await res.json();
  return typeof json?.data === 'number' ? json.data : 0;
}

function hasFeedCache(): boolean {
  const feed = queryClient.getQueryData(['userPosts']) as { pages?: unknown[] } | undefined;
  return Boolean(feed?.pages?.length);
}

/**
 * Instagram-style boot preload: feed (2 pages), stories, chats, market, unread badge.
 * On cold boot waits up to timeoutMs; on warm resume runs without blocking UI.
 */
export async function preloadAppData(
  token?: string | null,
  options: PreloadOptions = {}
): Promise<void> {
  const authToken = token ?? (await SecureStore.getItemAsync('auth_token'));
  if (!authToken) return;

  const timeoutMs = options.timeoutMs ?? 8000;
  const persistAfter = options.persistAfter ?? false;

  const userDataStr = await SecureStore.getItemAsync('user_data');
  const ownUserId = userDataStr ? JSON.parse(userDataStr)?.id : null;

  const preloadTasks = Promise.allSettled([
    prefetchFeedPages(6),
    prefetchStories(),
    prefetchConversations(),
    prefetchChatMessagesForTopConversations(10),
    prefetchMarketplace(),
    prefetchStoryMusicLibrary(),
    queryClient.prefetchQuery({
      queryKey: UNREAD_MESSAGES_QUERY_KEY,
      staleTime: 30 * 1000,
      queryFn: () => fetchUnreadCount(authToken),
    }),
    ...(ownUserId ? [prefetchUserProfilePages(ownUserId, 2)] : []),
  ]);

  // If we already have cached feed from disk, don't block the whole boot on network.
  const waitMs = hasFeedCache() ? Math.min(timeoutMs, 3000) : timeoutMs;

  await Promise.race([
    preloadTasks,
    new Promise<void>((resolve) => setTimeout(resolve, waitMs)),
  ]);

  warmAllMediaFromCache();

  if (persistAfter) {
    await flushQueryCache().catch(() => {});
  }
}

/** Silent refresh when returning from background — never blocks UI. */
export async function softRefreshAppData(): Promise<void> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  await preloadAppData(token, { timeoutMs: 0, persistAfter: true });
  queryClient.refetchQueries({ type: 'active', stale: true }).catch(() => {});
}

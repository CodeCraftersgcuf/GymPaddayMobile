import { InteractionManager } from 'react-native';
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
import { warmAllMediaFromCache, warmDeferredMediaFromCache } from '@/utils/mediaWarm';
import { getMediaBudgets, shouldDeferBackgroundWarm } from '@/utils/networkQuality';

export type PreloadOptions = {
  /** Max wait during cold boot splash (ms). Default 3000. */
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

function scheduleDeferredPreload(token: string, ownUserId: number | null): void {
  if (shouldDeferBackgroundWarm()) return;

  InteractionManager.runAfterInteractions(() => {
    setTimeout(() => {
      const budgets = getMediaBudgets();
      const deferred: Promise<unknown>[] = [];

      if (budgets.prefetchChatThreads > 0) {
        deferred.push(prefetchConversations());
        deferred.push(
          prefetchChatMessagesForTopConversations(budgets.prefetchChatThreads),
        );
      }
      deferred.push(prefetchMarketplace());
      if (ownUserId) {
        deferred.push(prefetchUserProfilePages(ownUserId, 1));
      }

      Promise.allSettled(deferred).then(() => {
        warmDeferredMediaFromCache();
      });
    }, 2000);
  });
}

/**
 * Critical boot path: feed page 1 + stories + unread badge only.
 * Marketplace, chat threads, music library deferred after first paint.
 */
export async function preloadAppData(
  token?: string | null,
  options: PreloadOptions = {},
): Promise<void> {
  const authToken = token ?? (await SecureStore.getItemAsync('auth_token'));
  if (!authToken) return;

  const timeoutMs = options.timeoutMs ?? 3000;
  const persistAfter = options.persistAfter ?? false;
  const budgets = getMediaBudgets();

  const userDataStr = await SecureStore.getItemAsync('user_data');
  const ownUserId = userDataStr ? JSON.parse(userDataStr)?.id : null;

  const feedPages = Math.max(1, budgets.prefetchFeedPagesOnBoot);

  const criticalTasks = Promise.allSettled([
    prefetchFeedPages(feedPages),
    prefetchStories(),
    queryClient.prefetchQuery({
      queryKey: UNREAD_MESSAGES_QUERY_KEY,
      staleTime: 30 * 1000,
      queryFn: () => fetchUnreadCount(authToken),
    }),
  ]);

  const waitMs = hasFeedCache() ? Math.min(timeoutMs, 1500) : timeoutMs;

  await Promise.race([
    criticalTasks,
    new Promise<void>((resolve) => setTimeout(resolve, waitMs)),
  ]);

  warmAllMediaFromCache();
  scheduleDeferredPreload(authToken, ownUserId ?? null);

  if (persistAfter) {
    await flushQueryCache().catch(() => {});
  }
}

/** Silent refresh when returning from background — tier-aware, never blocks UI. */
export async function softRefreshAppData(): Promise<void> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  const budgets = getMediaBudgets();

  await Promise.allSettled([
    prefetchFeedPages(Math.max(1, budgets.prefetchFeedPagesOnBoot)),
    prefetchStories(),
  ]);

  if (!shouldDeferBackgroundWarm()) {
    warmAllMediaFromCache();
    scheduleDeferredPreload(token, null);
  } else {
    warmAllMediaFromCache();
  }

  queryClient.refetchQueries({ type: 'active', stale: true }).catch(() => {});
  flushQueryCache().catch(() => {});
}

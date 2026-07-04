import { QueryClient } from '@tanstack/react-query';

export const STALE_TIMES = {
  feed: 5 * 60 * 1000,
  stories: 3 * 60 * 1000,
  conversations: 2 * 60 * 1000,
  market: 5 * 60 * 1000,
  profile: 5 * 60 * 1000,
} as const;

export const PERSISTED_QUERY_ROOT_KEYS = new Set([
  'userPosts',
  'groupedStories',
  'conversations',
  'marketplace-listings',
  'unread-messages-count',
  'userProfile',
]);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.statusCode === 401 || error?.statusCode === 403) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClientSave } from '@tanstack/react-query-persist-client';
import { PERSISTED_QUERY_ROOT_KEYS, queryClient } from '@/utils/queryClient';
import { sanitizeApiPost } from '@/utils/mediaUrl';

/** Bump when feed/media URL shape changes (e.g. R2 CDN migration). */
export const QUERY_PERSIST_KEY = 'gympaddy-react-query-v3';

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_PERSIST_KEY,
  throttleTime: 1000,
});

export const queryPersistOptions = {
  persister: queryPersister,
  maxAge: 24 * 60 * 60 * 1000,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) =>
      PERSISTED_QUERY_ROOT_KEYS.has(String(query.queryKey[0])),
  },
};

/** Rewrite legacy api.storage URLs in any hydrated feed cache. */
export function sanitizePersistedFeedQueries(): void {
  queryClient.setQueriesData({ queryKey: ['userPosts'] }, (old: unknown) => {
    const o = old as { pages?: Array<{ data?: unknown[] } & Record<string, unknown>> } | undefined;
    if (!o?.pages) return old;
    return {
      ...o,
      pages: o.pages.map((page) => {
        if (!Array.isArray(page?.data)) return page;
        return {
          ...page,
          data: page.data.map((post) =>
            post && typeof post === 'object'
              ? sanitizeApiPost(post as Record<string, unknown>)
              : post,
          ),
        };
      }),
    };
  });
}

/** Write the in-memory React Query cache to disk (call when app backgrounds). */
export async function flushQueryCache(): Promise<void> {
  await persistQueryClientSave({
    queryClient,
    ...queryPersistOptions,
  });
}

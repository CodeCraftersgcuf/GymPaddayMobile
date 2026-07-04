import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClientSave } from '@tanstack/react-query-persist-client';
import { PERSISTED_QUERY_ROOT_KEYS, queryClient } from '@/utils/queryClient';

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'gympaddy-react-query',
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

/** Write the in-memory React Query cache to disk (call when app backgrounds). */
export async function flushQueryCache(): Promise<void> {
  await persistQueryClientSave({
    queryClient,
    ...queryPersistOptions,
  });
}

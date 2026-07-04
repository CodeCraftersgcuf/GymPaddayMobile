import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { flushQueryCache } from '@/utils/queryPersistence';
import { saveFeedScrollState, saveLastRoute } from '@/utils/sessionPersistence';

type Props = {
  getFeedScrollOffset?: () => number;
  getActivePostId?: () => number | null;
};

/**
 * Persists navigation + query cache when the app is minimized or killed.
 */
export default function NavigationPersistence({
  getFeedScrollOffset,
  getActivePostId,
}: Props) {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const latestPath = useRef(pathname);
  const latestParams = useRef(params);

  useEffect(() => {
    latestPath.current = pathname;
    latestParams.current = params;
    saveLastRoute(pathname, params).catch(() => {});
  }, [pathname, params]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'background' && state !== 'inactive') return;

      saveLastRoute(latestPath.current, latestParams.current).catch(() => {});

      const offset = getFeedScrollOffset?.() ?? 0;
      const activePostId = getActivePostId?.() ?? null;
      saveFeedScrollState(offset, activePostId).catch(() => {});

      flushQueryCache().catch(() => {});
    });

    return () => subscription.remove();
  }, [getFeedScrollOffset, getActivePostId]);

  return null;
}

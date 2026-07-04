import { useCallback, useEffect, useRef } from 'react';
import type { ViewToken } from 'react-native';

type SilentInfiniteScrollOptions = {
  itemCount: number;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  /** Auto-fetch page 2+ once the first page has items. */
  autoPrefetchSecondPage?: boolean;
  firstPageReady?: boolean;
  /** Fetch when the user is within this many items of the list end. */
  thresholdFromEnd?: number;
  /** Preload this many API pages on first load (before user scrolls). */
  bootstrapPages?: number;
  /** How many pages are already in the infinite query. */
  loadedPageCount?: number;
  /** After a page finishes loading, fetch again if still near the end. */
  chainPrefetch?: boolean;
  resetKey?: string | number;
};

/**
 * Instagram-style silent infinite scroll: prefetch early, no bottom spinner.
 */
export function useSilentInfiniteScroll({
  itemCount,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  autoPrefetchSecondPage = true,
  firstPageReady,
  thresholdFromEnd = 5,
  bootstrapPages = 2,
  loadedPageCount = 0,
  chainPrefetch = true,
  resetKey,
}: SilentInfiniteScrollOptions) {
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  const itemCountRef = useRef(itemCount);
  const fetchNextPageRef = useRef(fetchNextPage);
  const prefetchedSecondPageRef = useRef(false);
  const lastMaxViewableIndexRef = useRef(-1);
  const wasFetchingRef = useRef(false);
  const ready = firstPageReady ?? itemCount > 0;

  useEffect(() => {
    hasNextPageRef.current = hasNextPage;
  }, [hasNextPage]);

  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  useEffect(() => {
    itemCountRef.current = itemCount;
  }, [itemCount]);

  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
  }, [fetchNextPage]);

  useEffect(() => {
    prefetchedSecondPageRef.current = false;
    lastMaxViewableIndexRef.current = -1;
  }, [resetKey]);

  const requestMore = useCallback(() => {
    if (hasNextPageRef.current && !isFetchingNextPageRef.current) {
      fetchNextPageRef.current();
    }
  }, []);

  const shouldPrefetchForIndex = useCallback(
    (maxIndex: number) => {
      const len = itemCountRef.current;
      if (len <= 0) return false;
      return maxIndex >= len - thresholdFromEnd;
    },
    [thresholdFromEnd],
  );

  const loadMore = useCallback(() => {
    requestMore();
  }, [requestMore]);

  useEffect(() => {
    if (!autoPrefetchSecondPage || prefetchedSecondPageRef.current) return;
    if (!ready || !hasNextPage || isFetchingNextPage) return;
    prefetchedSecondPageRef.current = true;
    requestMore();
  }, [autoPrefetchSecondPage, ready, hasNextPage, isFetchingNextPage, requestMore]);

  useEffect(() => {
    if (!ready || !hasNextPage || isFetchingNextPage) return;
    if (bootstrapPages <= 1) return;
    if (loadedPageCount >= bootstrapPages) return;
    requestMore();
  }, [
    bootstrapPages,
    loadedPageCount,
    ready,
    hasNextPage,
    isFetchingNextPage,
    requestMore,
  ]);

  useEffect(() => {
    if (!chainPrefetch) return;

    const wasFetching = wasFetchingRef.current;
    wasFetchingRef.current = Boolean(isFetchingNextPage);

    if (wasFetching && !isFetchingNextPage && hasNextPage) {
      const maxIndex = lastMaxViewableIndexRef.current;
      if (shouldPrefetchForIndex(maxIndex)) {
        requestMore();
      }
    }
  }, [chainPrefetch, isFetchingNextPage, hasNextPage, shouldPrefetchForIndex, requestMore]);

  const onPrefetchViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems.length) return;

      const maxIndex = Math.max(...viewableItems.map((v) => v.index ?? 0));
      lastMaxViewableIndexRef.current = maxIndex;

      if (!hasNextPageRef.current) return;
      if (shouldPrefetchForIndex(maxIndex)) {
        requestMore();
      }
    },
  ).current;

  const prefetchViewabilityConfig = useRef({
    itemVisiblePercentThreshold: 5,
    minimumViewTime: 80,
  }).current;

  return {
    loadMore,
    onPrefetchViewableItemsChanged,
    prefetchViewabilityConfig,
  };
}

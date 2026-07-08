import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type NetworkTier = 'good' | 'moderate' | 'poor' | 'offline';

export type MediaBudgets = {
  feedVideosAhead: number;
  hlsSegmentsPerVideo: number;
  fullMp4Prefetch: 'active' | 'off';
  storyUsersFullMedia: number;
  concurrentDownloads: number;
  warmFeedImagePages: number;
  prefetchFeedPagesOnBoot: number;
  prefetchChatThreads: number;
};

const BUDGETS: Record<NetworkTier, MediaBudgets> = {
  good: {
    feedVideosAhead: 6,
    hlsSegmentsPerVideo: 4,
    fullMp4Prefetch: 'active',
    storyUsersFullMedia: 6,
    concurrentDownloads: 4,
    warmFeedImagePages: 2,
    prefetchFeedPagesOnBoot: 1,
    prefetchChatThreads: 3,
  },
  moderate: {
    feedVideosAhead: 2,
    hlsSegmentsPerVideo: 2,
    fullMp4Prefetch: 'off',
    storyUsersFullMedia: 2,
    concurrentDownloads: 2,
    warmFeedImagePages: 1,
    prefetchFeedPagesOnBoot: 1,
    prefetchChatThreads: 0,
  },
  poor: {
    feedVideosAhead: 0,
    hlsSegmentsPerVideo: 0,
    fullMp4Prefetch: 'off',
    storyUsersFullMedia: 0,
    concurrentDownloads: 1,
    warmFeedImagePages: 0,
    prefetchFeedPagesOnBoot: 1,
    prefetchChatThreads: 0,
  },
  offline: {
    feedVideosAhead: 0,
    hlsSegmentsPerVideo: 0,
    fullMp4Prefetch: 'off',
    storyUsersFullMedia: 0,
    concurrentDownloads: 0,
    warmFeedImagePages: 0,
    prefetchFeedPagesOnBoot: 0,
    prefetchChatThreads: 0,
  },
};

let currentTier: NetworkTier = 'good';
const tierListeners = new Set<(tier: NetworkTier) => void>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeNetInfo: (() => void) | null = null;

function classifyTier(state: NetInfoState | null): NetworkTier {
  if (!state?.isConnected || state.isInternetReachable === false) {
    return 'offline';
  }

  const type = state.type;
  const details = state.details as Record<string, unknown> | null | undefined;

  if (type === 'wifi' || type === 'ethernet' || type === 'wimax') {
    return 'good';
  }

  if (type === 'cellular') {
    const gen = String(details?.cellularGeneration ?? '').toLowerCase();
    if (gen === '2g') return 'poor';
    if (gen === '3g') return 'moderate';
    if (gen === '4g' || gen === '5g') return 'good';
    if (details?.isConnectionExpensive === true) return 'moderate';
    return 'moderate';
  }

  if (type === 'none' || type === 'unknown') {
    return state.isConnected ? 'moderate' : 'offline';
  }

  return 'moderate';
}

function applyTier(next: NetworkTier): void {
  if (next === currentTier) return;
  currentTier = next;
  tierListeners.forEach((fn) => fn(currentTier));
}

function scheduleTierUpdate(state: NetInfoState): void {
  const next = classifyTier(state);
  if (debounceTimer) clearTimeout(debounceTimer);
  if (next === 'offline') {
    applyTier(next);
    return;
  }
  debounceTimer = setTimeout(() => applyTier(next), 2000);
}

/** Subscribe once at app boot; idempotent. */
export function initNetworkQuality(): () => void {
  if (unsubscribeNetInfo) return unsubscribeNetInfo;

  NetInfo.fetch().then((state) => applyTier(classifyTier(state)));
  unsubscribeNetInfo = NetInfo.addEventListener(scheduleTierUpdate);

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    unsubscribeNetInfo?.();
    unsubscribeNetInfo = null;
  };
}

export function getNetworkTier(): NetworkTier {
  return currentTier;
}

export function getMediaBudgets(): MediaBudgets {
  return BUDGETS[currentTier];
}

export function onNetworkTierChange(listener: (tier: NetworkTier) => void): () => void {
  tierListeners.add(listener);
  return () => tierListeners.delete(listener);
}

export function shouldDeferBackgroundWarm(): boolean {
  return currentTier === 'poor' || currentTier === 'offline';
}

let downloadSlotsInUse = 0;
const downloadWaiters: Array<() => void> = [];

/** Global cap on concurrent large media downloads across prefetchers. */
export async function acquireDownloadSlot(): Promise<() => void> {
  const max = getMediaBudgets().concurrentDownloads;
  if (max <= 0) {
    return () => {};
  }

  if (downloadSlotsInUse < max) {
    downloadSlotsInUse += 1;
    return () => {
      downloadSlotsInUse = Math.max(0, downloadSlotsInUse - 1);
      const next = downloadWaiters.shift();
      next?.();
    };
  }

  await new Promise<void>((resolve) => {
    downloadWaiters.push(resolve);
  });
  downloadSlotsInUse += 1;
  return () => {
    downloadSlotsInUse = Math.max(0, downloadSlotsInUse - 1);
    const next = downloadWaiters.shift();
    next?.();
  };
}

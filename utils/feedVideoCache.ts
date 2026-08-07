import * as FileSystem from 'expo-file-system/legacy';
import { downloadMediaFile } from '@/utils/mediaDownload';
import { getMediaBudgets, getNetworkTier } from '@/utils/networkQuality';
import { prefetchVideoUrl } from '@/utils/videoPrefetch';

const FEED_VIDEO_CACHE_DIR = `${FileSystem.cacheDirectory}feed-videos/`;
const MIN_MP4_BYTES = 48 * 1024;
const MAX_CACHED_VIDEOS = 40;

const localUriByPostId = new Map<number, string>();
const accessOrder: number[] = [];
const inFlight = new Set<number>();
const prefetchQueued = new Set<number>();
const pinnedQueued = new Set<number>();
const pendingRemote = new Map<number, string>();
const cacheListeners = new Map<number, Set<(uri: string) => void>>();

let activeFeedPostId: number | null = null;

export function setActiveFeedPostId(postId: number | null): void {
  activeFeedPostId = postId;
}

function normalizeLocalUri(path: string): string {
  if (!path) return path;
  if (path.startsWith('file://') || path.startsWith('http')) return path;
  return path.startsWith('/') ? `file://${path}` : `file:///${path}`;
}

function touchPost(postId: number): void {
  const idx = accessOrder.indexOf(postId);
  if (idx >= 0) accessOrder.splice(idx, 1);
  accessOrder.push(postId);
  while (accessOrder.length > MAX_CACHED_VIDEOS) {
    const evictId = accessOrder.shift();
    if (evictId != null) {
      localUriByPostId.delete(evictId);
      FileSystem.deleteAsync(`${FEED_VIDEO_CACHE_DIR}${evictId}.mp4`, {
        idempotent: true,
      }).catch(() => {});
    }
  }
}

function notifyCached(postId: number, uri: string): void {
  cacheListeners.get(postId)?.forEach((cb) => cb(uri));
}

export function subscribeFeedVideoCached(
  postId: number,
  listener: (uri: string) => void,
): () => void {
  if (!cacheListeners.has(postId)) {
    cacheListeners.set(postId, new Set());
  }
  cacheListeners.get(postId)!.add(listener);
  const existing = localUriByPostId.get(postId);
  if (existing) listener(existing);
  return () => {
    cacheListeners.get(postId)?.delete(listener);
  };
}

async function ensureCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(FEED_VIDEO_CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(FEED_VIDEO_CACHE_DIR, { intermediates: true });
  }
}

function maxConcurrent(): number {
  return Math.max(1, getMediaBudgets().concurrentDownloads);
}

async function downloadMp4(postId: number, remoteUrl: string): Promise<string | null> {
  await ensureCacheDir();
  const localPath = `${FEED_VIDEO_CACHE_DIR}${postId}.mp4`;
  const cached = await downloadMediaFile(remoteUrl, localPath, { minBytes: MIN_MP4_BYTES });
  if (cached) {
    localUriByPostId.set(postId, cached);
    touchPost(postId);
    notifyCached(postId, cached);
  }
  return cached;
}

function startDownload(postId: number): void {
  const remote = pendingRemote.get(postId);
  if (!remote) {
    inFlight.delete(postId);
    return;
  }

  inFlight.add(postId);
  prefetchQueued.delete(postId);
  pinnedQueued.delete(postId);

  downloadMp4(postId, remote)
    .catch(() => {})
    .finally(() => {
      inFlight.delete(postId);
      pendingRemote.delete(postId);
      drainQueue();
    });
}

function drainQueue(): void {
  if (inFlight.size >= maxConcurrent()) return;

  for (const postId of pinnedQueued) {
    if (inFlight.size >= maxConcurrent()) break;
    if (localUriByPostId.has(postId)) {
      pinnedQueued.delete(postId);
      continue;
    }
    startDownload(postId);
    return;
  }

  if (getMediaBudgets().fullMp4Prefetch === 'off') return;

  for (const postId of prefetchQueued) {
    if (inFlight.size >= maxConcurrent()) break;
    if (localUriByPostId.has(postId)) {
      prefetchQueued.delete(postId);
      continue;
    }
    const budgets = getMediaBudgets();
    if (
      budgets.fullMp4Prefetch === 'active' &&
      activeFeedPostId != null &&
      activeFeedPostId !== postId
    ) {
      continue;
    }
    startDownload(postId);
    return;
  }
}

function queueDownload(postId: number, mp4Url: string, pinned: boolean): void {
  if (!postId || !mp4Url) return;
  if (localUriByPostId.has(postId) || inFlight.has(postId)) return;

  pendingRemote.set(postId, mp4Url);
  if (pinned) {
    prefetchQueued.delete(postId);
    pinnedQueued.add(postId);
  } else if (!pinnedQueued.has(postId)) {
    prefetchQueued.add(postId);
  }
  drainQueue();
}

/** Background MP4 warm for the active feed post (good network only). */
export function prefetchFeedVideoMp4(postId: number, mp4Url?: string | null): void {
  if (!postId || !mp4Url) return;
  if (getMediaBudgets().fullMp4Prefetch === 'off') return;
  queueDownload(postId, mp4Url, false);
}

/**
 * After the user watches a video once, save MP4 to disk for instant replay
 * (works offline on second play — Instagram-style).
 */
export function pinPostVideoForReplay(postId: number, mp4Url?: string | null): void {
  if (!postId || !mp4Url) return;
  if (localUriByPostId.has(postId)) return;
  if (getNetworkTier() === 'offline') return;
  queueDownload(postId, mp4Url, true);
}

export function cancelFeedVideoDownload(postId: number): void {
  prefetchQueued.delete(postId);
  pinnedQueued.delete(postId);
  pendingRemote.delete(postId);
}

export function getCachedFeedVideoUri(postId: number): string | undefined {
  return localUriByPostId.get(postId);
}

export function isFeedVideoCachedLocally(postId: number): boolean {
  return localUriByPostId.has(postId);
}

export function clearCachedFeedVideo(postId: number): void {
  localUriByPostId.delete(postId);
  cancelFeedVideoDownload(postId);
  const idx = accessOrder.indexOf(postId);
  if (idx >= 0) accessOrder.splice(idx, 1);
  FileSystem.deleteAsync(`${FEED_VIDEO_CACHE_DIR}${postId}.mp4`, { idempotent: true }).catch(
    () => {},
  );
  // Empty string tells subscribers to drop local playback and use CDN.
  cacheListeners.get(postId)?.forEach((cb) => cb(''));
}

/** Playback: local cache → MP4 → HLS. expo-av is more reliable with progressive MP4. */
export async function pickFeedVideoPlaybackUrl(
  postId: number,
  mp4Url?: string | null,
  hlsUrl?: string | null,
): Promise<string> {
  const cached = localUriByPostId.get(postId);
  if (cached) {
    touchPost(postId);
    return cached;
  }

  if (mp4Url) {
    if (getMediaBudgets().fullMp4Prefetch === 'active' && activeFeedPostId === postId) {
      prefetchFeedVideoMp4(postId, mp4Url);
    }
    return mp4Url;
  }

  if (hlsUrl) {
    prefetchVideoUrl(hlsUrl);
    return hlsUrl;
  }

  return '';
}

export async function warmFeedVideoCacheOnDisk(): Promise<void> {
  await ensureCacheDir();
  try {
    const files = await FileSystem.readDirectoryAsync(FEED_VIDEO_CACHE_DIR);
    for (const file of files) {
      const match = file.match(/^(\d+)\.mp4$/);
      if (!match) continue;
      const id = parseInt(match[1], 10);
      const path = `${FEED_VIDEO_CACHE_DIR}${file}`;
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists && (info.size ?? 0) >= MIN_MP4_BYTES) {
        localUriByPostId.set(id, normalizeLocalUri(path));
        touchPost(id);
      } else {
        await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
      }
    }
  } catch {
    /* best-effort */
  }
}

export function shouldWaitForMp4Cache(): boolean {
  return getNetworkTier() === 'good';
}

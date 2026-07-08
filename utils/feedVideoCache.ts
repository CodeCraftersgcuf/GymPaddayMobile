import * as FileSystem from 'expo-file-system/legacy';
import { prefetchVideoUrl } from '@/utils/videoPrefetch';

const FEED_VIDEO_CACHE_DIR = `${FileSystem.cacheDirectory}feed-videos/`;
const MIN_MP4_BYTES = 48 * 1024;
const MAX_CACHED_VIDEOS = 24;
const MAX_CONCURRENT = 3;

const localUriByPostId = new Map<number, string>();
const accessOrder: number[] = [];
const inFlight = new Set<number>();
const queued = new Set<number>();

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

async function ensureCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(FEED_VIDEO_CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(FEED_VIDEO_CACHE_DIR, { intermediates: true });
  }
}

async function downloadMp4(postId: number, remoteUrl: string): Promise<string | null> {
  await ensureCacheDir();
  const localPath = `${FEED_VIDEO_CACHE_DIR}${postId}.mp4`;

  const existing = await FileSystem.getInfoAsync(localPath);
  if (existing.exists && (existing.size ?? 0) >= MIN_MP4_BYTES) {
    const uri = normalizeLocalUri(localPath);
    localUriByPostId.set(postId, uri);
    touchPost(postId);
    return uri;
  }

  try {
    const result = await FileSystem.downloadAsync(remoteUrl, localPath);
    if (!result?.uri) return null;
    if (typeof result.status === 'number' && result.status >= 400) {
      await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
      return null;
    }
    const saved = await FileSystem.getInfoAsync(localPath);
    if (!saved.exists || (saved.size ?? 0) < MIN_MP4_BYTES) {
      await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
      return null;
    }
    const uri = normalizeLocalUri(result.uri || localPath);
    localUriByPostId.set(postId, uri);
    touchPost(postId);
    return uri;
  } catch {
    await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
    return null;
  }
}

function drainQueue(): void {
  if (inFlight.size >= MAX_CONCURRENT) return;

  for (const postId of queued) {
    if (inFlight.size >= MAX_CONCURRENT) break;
    const uri = localUriByPostId.get(postId);
    if (uri) {
      queued.delete(postId);
      continue;
    }
    inFlight.add(postId);
    queued.delete(postId);
    const remote = pendingRemote.get(postId);
    if (!remote) {
      inFlight.delete(postId);
      continue;
    }
    downloadMp4(postId, remote)
      .catch(() => {})
      .finally(() => {
        inFlight.delete(postId);
        pendingRemote.delete(postId);
        drainQueue();
      });
    break;
  }
}

const pendingRemote = new Map<number, string>();

/** Queue MP4 download for a feed post (background). */
export function prefetchFeedVideoMp4(postId: number, mp4Url?: string | null): void {
  if (!postId || !mp4Url) return;
  if (localUriByPostId.has(postId) || inFlight.has(postId) || queued.has(postId)) return;
  pendingRemote.set(postId, mp4Url);
  queued.add(postId);
  drainQueue();
}

export function getCachedFeedVideoUri(postId: number): string | undefined {
  return localUriByPostId.get(postId);
}

export function clearCachedFeedVideo(postId: number): void {
  localUriByPostId.delete(postId);
  const idx = accessOrder.indexOf(postId);
  if (idx >= 0) accessOrder.splice(idx, 1);
  FileSystem.deleteAsync(`${FEED_VIDEO_CACHE_DIR}${postId}.mp4`, { idempotent: true }).catch(
    () => {},
  );
}

/** Best URI for playback: local MP4 if ready, else remote MP4, else HLS. */
export async function pickFeedVideoPlaybackUrl(
  postId: number,
  mp4Url?: string | null,
  hlsUrl?: string | null,
  waitForDownloadMs = 500,
): Promise<string> {
  const cached = localUriByPostId.get(postId);
  if (cached) {
    touchPost(postId);
    return cached;
  }

  if (mp4Url) {
    prefetchFeedVideoMp4(postId, mp4Url);
    const deadline = Date.now() + waitForDownloadMs;
    while (inFlight.has(postId) && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 40));
    }
    const ready = localUriByPostId.get(postId);
    if (ready) return ready;
    return mp4Url;
  }

  if (hlsUrl) {
    prefetchVideoUrl(hlsUrl);
    return hlsUrl;
  }

  return '';
}

/** Restore cache map from disk on boot. */
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

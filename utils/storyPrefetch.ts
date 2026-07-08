import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import { GroupedUserStories, StoryItem } from '@/utils/types/story';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { queryClient } from '@/utils/queryClient';
import { prefetchVideoUrl } from '@/utils/videoPrefetch';
import { downloadMediaFile } from '@/utils/mediaDownload';
import { getMediaBudgets } from '@/utils/networkQuality';

const STORY_CACHE_DIR = `${FileSystem.cacheDirectory}story-media/`;
const DEFAULT_PRIORITY_USERS = 6;

type StoryWithMusic = StoryItem & {
  music_url?: string | null;
  music?: { url?: string | null } | null;
  musicUrl?: string | null;
};

const videoLocalUri = new Map<number, string>();
const musicLocalUri = new Map<number, string>();
const downloadingStoryIds = new Set<number>();
const prefetchedKeys = new Set<string>();

const MIN_VIDEO_CACHE_BYTES = 32 * 1024;

type PrefetchTask = {
  key: string;
  priority: number;
  run: () => Promise<void>;
};

const queue: PrefetchTask[] = [];
let inFlight = 0;

function normalizeStoryUrl(url: string): string {
  return url.replace('https://api.gympaddy.com/storage//', 'https://api.gympaddy.com/storage/');
}

function isStoryPhoto(story: StoryItem): boolean {
  return story.media_type === 'photo' || (story as StoryItem & { media_type?: string }).media_type === 'image';
}

function isStoryVideo(story: StoryItem): boolean {
  return story.media_type === 'video';
}

function storyMediaUrl(story: StoryItem): string | null {
  const resolved = resolveMediaUrl(story.full_media_url);
  return resolved ? normalizeStoryUrl(resolved) : null;
}

function storyMusicUrl(story: StoryWithMusic): string | null {
  const candidate =
    story.music_url ??
    story.music?.url ??
    story.musicUrl ??
    undefined;
  if (!candidate || typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  const resolved = resolveMediaUrl(trimmed);
  return resolved ? normalizeStoryUrl(resolved) : null;
}

function storyMediaKey(story: StoryItem): string {
  return `media-${story.id}-${story.full_media_url}`;
}

async function ensureCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(STORY_CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(STORY_CACHE_DIR, { intermediates: true });
  }
}

function enqueue(task: PrefetchTask): void {
  if (prefetchedKeys.has(task.key)) return;
  prefetchedKeys.add(task.key);
  queue.push(task);
  queue.sort((a, b) => b.priority - a.priority);
  drainQueue();
}

function maxConcurrent(): number {
  return Math.max(1, getMediaBudgets().concurrentDownloads);
}

function prefetchImageLow(uri: string): void {
  if (!uri) return;
  Image.prefetch(uri).catch(() => {});
}
function drainQueue(): void {
  while (inFlight < maxConcurrent() && queue.length > 0) {
    const task = queue.shift()!;
    inFlight += 1;
    task
      .run()
      .catch(() => {})
      .finally(() => {
        inFlight -= 1;
        drainQueue();
      });
  }
}

function normalizeLocalUri(path: string): string {
  if (!path) return path;
  if (path.startsWith('file://') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return path.startsWith('/') ? `file://${path}` : `file:///${path}`;
}

async function downloadToCache(
  remoteUrl: string,
  localPath: string,
  minBytes = 1,
): Promise<string | null> {
  return downloadMediaFile(remoteUrl, localPath, { minBytes });
}

async function prefetchStoryVideo(story: StoryItem, url: string): Promise<void> {
  if (/\.m3u8(\?|$)/i.test(url)) {
    prefetchVideoUrl(url);
    return;
  }

  downloadingStoryIds.add(story.id);
  try {
    await ensureCacheDir();
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'mp4';
    const safeExt = ['mp4', 'mov', 'webm', 'm4v'].includes(ext) ? ext : 'mp4';
    const localPath = `${STORY_CACHE_DIR}${story.id}.${safeExt}`;
    const cached = await downloadToCache(url, localPath, MIN_VIDEO_CACHE_BYTES);
    if (cached) {
      videoLocalUri.set(story.id, cached);
    } else {
      videoLocalUri.delete(story.id);
    }
  } finally {
    downloadingStoryIds.delete(story.id);
  }
}

async function prefetchStoryMusic(story: StoryWithMusic, url: string): Promise<void> {
  await ensureCacheDir();
  const localPath = `${STORY_CACHE_DIR}music-${story.id}.mp3`;
  const cached = await downloadToCache(url, localPath);
  if (cached) {
    musicLocalUri.set(story.id, cached);
  }
}

/** Scan disk cache on boot so viewer can use file:// URIs immediately. */
export async function warmStoryCacheOnDisk(): Promise<void> {
  await ensureCacheDir();
  try {
    const files = await FileSystem.readDirectoryAsync(STORY_CACHE_DIR);
    for (const file of files) {
      const videoMatch = file.match(/^(\d+)\.[a-z0-9]+$/i);
      if (videoMatch) {
        const id = parseInt(videoMatch[1], 10);
        const path = `${STORY_CACHE_DIR}${file}`;
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists && (info.size ?? 0) >= MIN_VIDEO_CACHE_BYTES) {
          videoLocalUri.set(id, normalizeLocalUri(path));
        } else {
          await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
        }
        continue;
      }
      const musicMatch = file.match(/^music-(\d+)\.mp3$/i);
      if (musicMatch) {
        const id = parseInt(musicMatch[1], 10);
        const path = `${STORY_CACHE_DIR}${file}`;
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists && (info.size ?? 0) > 0) {
          musicLocalUri.set(id, normalizeLocalUri(path));
        }
      }
    }
  } catch {
    /* best-effort */
  }
}

export function getCachedStoryVideoUri(storyId: number): string | undefined {
  return videoLocalUri.get(storyId);
}

export function getCachedStoryMusicUri(storyId: number): string | undefined {
  return musicLocalUri.get(storyId);
}

/** Drop a bad on-disk video entry so playback can fall back to CDN. */
export function clearCachedStoryVideo(storyId: number): void {
  videoLocalUri.delete(storyId);
}

/** Prefer on-disk story video when prefetched; otherwise remote CDN URL. */
export function resolveStoryMediaUrl(story?: StoryItem | null): string {
  if (!story) return '';
  const remote = storyMediaUrl(story) ?? '';
  if (!isStoryVideo(story)) return remote;

  if (downloadingStoryIds.has(story.id)) return remote;

  const cached = getCachedStoryVideoUri(story.id);
  if (cached) return cached;
  return remote;
}

export function isStoryVideoCached(storyId: number): boolean {
  return videoLocalUri.has(storyId) && !downloadingStoryIds.has(storyId);
}

export function getStoryThumbnailUrl(story?: StoryItem | null): string {
  if (!story) return '';
  const thumb = story.full_thumbnail_url;
  if (thumb) {
    const resolved = resolveMediaUrl(thumb);
    if (resolved) return normalizeStoryUrl(resolved);
  }
  return storyMediaUrl(story) ?? '';
}

/**
 * Pick one playback URL up front — verified cache or CDN.
 * Avoids play-cache-fail-retry flicker.
 */
export async function pickStoryPlaybackUrl(
  story: StoryItem,
  waitForDownloadMs = 400,
): Promise<string> {
  const remote = storyMediaUrl(story) ?? '';
  if (!isStoryVideo(story)) return remote;

  const deadline = Date.now() + waitForDownloadMs;
  while (downloadingStoryIds.has(story.id) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 40));
  }

  const cached = videoLocalUri.get(story.id);
  if (cached && !downloadingStoryIds.has(story.id)) {
    try {
      const info = await FileSystem.getInfoAsync(cached);
      if (info.exists && (info.size ?? 0) >= MIN_VIDEO_CACHE_BYTES) {
        return cached;
      }
      videoLocalUri.delete(story.id);
      await FileSystem.deleteAsync(cached, { idempotent: true }).catch(() => {});
    } catch {
      videoLocalUri.delete(story.id);
    }
  }

  return remote;
}

/** Remote CDN URL only — use when cached playback fails. */
export function resolveStoryMediaRemoteUrl(story?: StoryItem | null): string {
  return storyMediaUrl(story) ?? '';
}

/** Prefer on-disk music clip when prefetched. */
export function resolveStoryMusicPlaybackUrl(story?: StoryWithMusic | null): string | undefined {
  if (!story) return undefined;
  const cached = getCachedStoryMusicUri(story.id);
  if (cached) return cached;
  const remote = storyMusicUrl(story);
  return remote ?? undefined;
}

export function prefetchStoryItem(
  story: StoryItem,
  priority = 0,
  options?: { fullMedia?: boolean },
): void {
  const fullMedia = options?.fullMedia ?? true;
  const thumb = getStoryThumbnailUrl(story);
  if (thumb) {
    const thumbKey = `thumb-${story.id}-${thumb}`;
    if (!prefetchedKeys.has(thumbKey)) {
      enqueue({
        key: thumbKey,
        priority: priority + 50,
        run: async () => {
          prefetchImageLow(thumb);
        },
      });
    }
  }

  if (!fullMedia) return;

  const url = storyMediaUrl(story);
  if (!url) return;

  const key = storyMediaKey(story);
  if (prefetchedKeys.has(key)) return;

  if (isStoryPhoto(story)) {
    enqueue({
      key,
      priority,
      run: async () => {
        prefetchImageLow(url);
      },
    });
  } else if (isStoryVideo(story) || !isStoryPhoto(story)) {
    enqueue({
      key,
      priority,
      run: async () => prefetchStoryVideo(story, url),
    });
  }

  const music = storyMusicUrl(story as StoryWithMusic);
  if (music) {
    const musicKey = `music-${story.id}-${music}`;
    if (!prefetchedKeys.has(musicKey)) {
      enqueue({
        key: musicKey,
        priority: priority + 5,
        run: async () => prefetchStoryMusic(story as StoryWithMusic, music),
      });
    }
  }
}

async function pruneStaleStoryCache(activeStoryIds: Set<number>): Promise<void> {
  try {
    await ensureCacheDir();
    const files = await FileSystem.readDirectoryAsync(STORY_CACHE_DIR);
    await Promise.allSettled(
      files.map(async (file) => {
        const videoMatch = file.match(/^(\d+)\./);
        if (videoMatch) {
          const id = parseInt(videoMatch[1], 10);
          if (!activeStoryIds.has(id)) {
            videoLocalUri.delete(id);
            await FileSystem.deleteAsync(`${STORY_CACHE_DIR}${file}`, { idempotent: true });
          }
          return;
        }
        const musicMatch = file.match(/^music-(\d+)\./);
        if (musicMatch) {
          const id = parseInt(musicMatch[1], 10);
          if (!activeStoryIds.has(id)) {
            musicLocalUri.delete(id);
            await FileSystem.deleteAsync(`${STORY_CACHE_DIR}${file}`, { idempotent: true });
          }
        }
      }),
    );
  } catch {
    /* best-effort */
  }
}

/**
 * Warm avatars + thumbnails for all rings; full video/music only for first N users (tier budget).
 */
export function prefetchGroupedStories(
  groups: GroupedUserStories[],
  options?: { priorityUserCount?: number },
): void {
  if (!groups.length) return;

  const priorityUserCount =
    options?.priorityUserCount ?? getMediaBudgets().storyUsersFullMedia;
  const activeIds = new Set<number>();

  groups.forEach((group, userIndex) => {
    const userPriority =
      userIndex < priorityUserCount ? 200 - userIndex * 10 : 40 - Math.min(userIndex, 20);
    const fullMedia = userIndex < priorityUserCount;

    const avatar = group.user?.profile_picture_url;
    if (avatar) {
      const resolvedAvatar = resolveMediaUrl(avatar);
      if (resolvedAvatar) {
        const avatarKey = `avatar-${group.user.id}-${resolvedAvatar}`;
        enqueue({
          key: avatarKey,
          priority: userPriority + 80,
          run: async () => {
            prefetchImageLow(resolvedAvatar);
          },
        });
      }
    }

    const stories = group.stories ?? [];
    stories.forEach((story, storyIndex) => {
      activeIds.add(story.id);
      const slidePriority = userPriority + (stories.length - storyIndex) * 2;
      prefetchStoryItem(story, slidePriority, { fullMedia });
    });
  });

  pruneStaleStoryCache(activeIds).catch(() => {});
}

export function prefetchStoriesFromCache(): void {
  const grouped = queryClient.getQueryData<GroupedUserStories[]>(['groupedStories']);
  if (grouped?.length) {
    prefetchGroupedStories(grouped);
  }
}

/** Boost current slide + next few while the viewer is open. */
export function prefetchAdjacentStories(stories: StoryItem[], currentIndex: number): void {
  if (!stories.length) return;

  for (let offset = 0; offset <= 3; offset += 1) {
    const idx = currentIndex + offset;
    if (idx < stories.length) {
      prefetchStoryItem(stories[idx], 300 - offset * 10, { fullMedia: true });
    }
  }

  for (let offset = 1; offset <= 2; offset += 1) {
    const idx = currentIndex - offset;
    if (idx >= 0) {
      prefetchStoryItem(stories[idx], 250 - offset * 10, { fullMedia: true });
    }
  }
}

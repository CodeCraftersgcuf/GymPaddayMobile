import { Image } from 'expo-image';
import { queryClient } from '@/utils/queryClient';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { mapPostFromApi } from '@/utils/mapFeedPost';
import { prefetchGroupedStories } from '@/utils/storyPrefetch';
import {
  prefetchFeedVideosFromIndex,
  prefetchVideoFromRawPost,
  FEED_PREFETCH_AHEAD,
  REELS_PREFETCH_AHEAD,
} from '@/utils/videoPrefetch';
import { warmFeedVideoCacheOnDisk } from '@/utils/feedVideoCache';
import { prefetchUserProfile } from '@/utils/navigateToProfile';

/** Aggressive boot warm: stories, feed images, videos, market, profiles, music. */
export function warmAllMediaFromCache(): void {
  warmFeedVideoCacheOnDisk().catch(() => {});
  prefetchGroupedStoriesFromCache();
  warmFeedImagesFromCache(2);
  warmFeedVideosFromCache(Math.max(FEED_PREFETCH_AHEAD, 30));
  warmMarketImagesFromCache();
  warmStoryMusicFromCache();
  warmTopChatAuthorsFromCache();
}

function prefetchGroupedStoriesFromCache(): void {
  const grouped = queryClient.getQueryData<any[]>(['groupedStories']);
  if (grouped?.length) {
    prefetchGroupedStories(grouped, { priorityUserCount: grouped.length });
  }
}

export function warmFeedImagesFromCache(pages = 2): void {
  try {
    const cache = queryClient.getQueryData<any>(['userPosts']);
    const pageList: any[][] = cache?.pages?.map((p: any) => p?.data ?? []) ?? [];
    const posts = pageList.slice(0, pages).flat();

    for (const raw of posts) {
      const mapped = mapPostFromApi(raw);
      if (mapped.user?.profile_picture) {
        Image.prefetch(mapped.user.profile_picture).catch(() => {});
      }
      for (const img of mapped.imagesUrl ?? []) {
        const url = resolveMediaUrl(img) || img;
        if (url) Image.prefetch(url).catch(() => {});
      }
      const thumb = raw?.media?.find((m: any) => m.media_type === 'video')?.thumbnail_url;
      if (thumb) {
        Image.prefetch(resolveMediaUrl(thumb) || thumb).catch(() => {});
      }
    }
  } catch {
    /* best-effort */
  }
}

export function warmFeedVideosFromCache(count = REELS_PREFETCH_AHEAD): void {
  try {
    const cache = queryClient.getQueryData<any>(['userPosts']);
    const rawPosts: any[] = cache?.pages?.flatMap((p: any) => p?.data ?? []) ?? [];
    const videoPosts = rawPosts
      .map((raw) => mapPostFromApi(raw))
      .filter((p) => p.videoUrl);
    prefetchFeedVideosFromIndex(videoPosts, 0, count);
    let warmed = 0;
    for (const raw of rawPosts) {
      if (warmed >= count) break;
      if (raw?.media?.some((m: any) => m.media_type === 'video')) {
        prefetchVideoFromRawPost(raw);
        warmed += 1;
      }
    }
  } catch {
    /* best-effort */
  }
}

export function warmMarketImagesFromCache(): void {
  try {
    const listings = queryClient.getQueryData<any>(['marketplace-listings']);
    const items: any[] = listings?.data ?? listings ?? [];
    for (const item of items.slice(0, 40)) {
      const img = item?.image_url || item?.image || item?.images?.[0];
      const url = resolveMediaUrl(img);
      if (url) Image.prefetch(url).catch(() => {});
    }
  } catch {
    /* best-effort */
  }
}

export function warmStoryMusicFromCache(): void {
  try {
    const tracks = queryClient.getQueryData<any[]>(['storyMusicLibrary']);
    for (const track of tracks ?? []) {
      if (track?.preview) fetch(track.preview).catch(() => {});
    }
  } catch {
    /* best-effort */
  }
}

function warmTopChatAuthorsFromCache(): void {
  try {
    const conversations = queryClient.getQueryData<any>(['conversations'])?.conversations ?? [];
    for (const conv of conversations.slice(0, 10)) {
      const avatar = conv?.other_user?.profile_picture_url;
      if (avatar) Image.prefetch(resolveMediaUrl(avatar) || avatar).catch(() => {});
    }
  } catch {
    /* best-effort */
  }
}

/** Prefetch profile for authors visible in the feed. */
export function prefetchProfilesForFeedPosts(rawPosts: any[], limit = 8): void {
  const seen = new Set<string>();
  for (const raw of rawPosts) {
    if (seen.size >= limit) break;
    const userId = raw?.user?.id ?? raw?.user_id;
    if (!userId || seen.has(String(userId))) continue;
    seen.add(String(userId));
    prefetchUserProfile(userId).catch(() => {});
  }
}

import { Image } from 'expo-image';
import { queryClient } from '@/utils/queryClient';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { mapPostFromApi } from '@/utils/mapFeedPost';
import { prefetchGroupedStories } from '@/utils/storyPrefetch';
import {
  prefetchFeedVideosFromIndex,
  prefetchVideoFromRawPost,
  getFeedPrefetchAhead,
  getReelsPrefetchAhead,
} from '@/utils/videoPrefetch';
import { warmFeedVideoCacheOnDisk } from '@/utils/feedVideoCache';
import { prefetchUserProfile } from '@/utils/navigateToProfile';
import { getMediaBudgets, shouldDeferBackgroundWarm } from '@/utils/networkQuality';

function prefetchImageLow(uri: string): void {
  if (!uri) return;
  Image.prefetch(uri).catch(() => {});
}

/** Tier-aware warm from disk cache — visible content wins on weak networks. */
export function warmAllMediaFromCache(): void {
  warmFeedVideoCacheOnDisk().catch(() => {});

  if (shouldDeferBackgroundWarm()) {
    warmThumbnailsOnlyFromCache();
    return;
  }

  prefetchGroupedStoriesFromCache();
  const budgets = getMediaBudgets();
  if (budgets.warmFeedImagePages > 0) {
    warmFeedImagesFromCache(budgets.warmFeedImagePages);
  }
  if (budgets.feedVideosAhead > 0) {
    warmFeedVideosFromCache(getReelsPrefetchAhead());
  }
}

function warmThumbnailsOnlyFromCache(): void {
  try {
    const grouped = queryClient.getQueryData<any[]>(['groupedStories']);
    if (grouped?.length) {
      prefetchGroupedStories(grouped, { priorityUserCount: 0 });
    }
    const cache = queryClient.getQueryData<any>(['userPosts']);
    const rawPosts: any[] = cache?.pages?.[0]?.data ?? [];
    for (const raw of rawPosts.slice(0, 10)) {
      const thumb = raw?.media?.find((m: any) => m.media_type === 'video')?.thumbnail_url;
      if (thumb) prefetchImageLow(resolveMediaUrl(thumb) || thumb);
    }
  } catch {
    /* best-effort */
  }
}

function prefetchGroupedStoriesFromCache(): void {
  const grouped = queryClient.getQueryData<any[]>(['groupedStories']);
  if (grouped?.length) {
    prefetchGroupedStories(grouped);
  }
}

export function warmFeedImagesFromCache(pages = 2): void {
  if (getMediaBudgets().warmFeedImagePages <= 0) return;

  try {
    const cache = queryClient.getQueryData<any>(['userPosts']);
    const pageList: any[][] = cache?.pages?.map((p: any) => p?.data ?? []) ?? [];
    const posts = pageList.slice(0, pages).flat();

    for (const raw of posts) {
      const mapped = mapPostFromApi(raw);
      if (mapped.user?.profile_picture) {
        prefetchImageLow(mapped.user.profile_picture);
      }
      for (const img of mapped.imagesUrl ?? []) {
        const url = resolveMediaUrl(img) || img;
        if (url) prefetchImageLow(url);
      }
      const thumb = raw?.media?.find((m: any) => m.media_type === 'video')?.thumbnail_url;
      if (thumb) {
        prefetchImageLow(resolveMediaUrl(thumb) || thumb);
      }
    }
  } catch {
    /* best-effort */
  }
}

export function warmFeedVideosFromCache(count?: number): void {
  const limit = count ?? getReelsPrefetchAhead();
  if (limit <= 0 || getFeedPrefetchAhead() <= 0) return;

  try {
    const cache = queryClient.getQueryData<any>(['userPosts']);
    const rawPosts: any[] = cache?.pages?.flatMap((p: any) => p?.data ?? []) ?? [];
    const videoPosts = rawPosts
      .map((raw) => mapPostFromApi(raw))
      .filter((p) => p.videoUrl);
    prefetchFeedVideosFromIndex(videoPosts, 0, limit);
    let warmed = 0;
    for (const raw of rawPosts) {
      if (warmed >= limit) break;
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
  if (shouldDeferBackgroundWarm()) return;

  try {
    const listings = queryClient.getQueryData<any>(['marketplace-listings']);
    const items: any[] = listings?.data ?? listings ?? [];
    for (const item of items.slice(0, 20)) {
      const img = item?.image_url || item?.image || item?.images?.[0];
      const url = resolveMediaUrl(img);
      if (url) prefetchImageLow(url);
    }
  } catch {
    /* best-effort */
  }
}

export function warmStoryMusicFromCache(): void {
  if (shouldDeferBackgroundWarm()) return;

  try {
    const tracks = queryClient.getQueryData<any[]>(['storyMusicLibrary']);
    for (const track of (tracks ?? []).slice(0, 8)) {
      if (track?.preview) fetch(track.preview).catch(() => {});
    }
  } catch {
    /* best-effort */
  }
}

function warmTopChatAuthorsFromCache(): void {
  if (shouldDeferBackgroundWarm()) return;

  try {
    const conversations = queryClient.getQueryData<any>(['conversations'])?.conversations ?? [];
    for (const conv of conversations.slice(0, 5)) {
      const avatar = conv?.other_user?.profile_picture_url;
      if (avatar) prefetchImageLow(resolveMediaUrl(avatar) || avatar);
    }
  } catch {
    /* best-effort */
  }
}

export function warmDeferredMediaFromCache(): void {
  if (shouldDeferBackgroundWarm()) return;
  warmMarketImagesFromCache();
  warmStoryMusicFromCache();
  warmTopChatAuthorsFromCache();
}

/** Prefetch profile for authors visible in the feed. */
export function prefetchProfilesForFeedPosts(rawPosts: any[], limit = 8): void {
  if (shouldDeferBackgroundWarm()) return;

  const seen = new Set<string>();
  for (const raw of rawPosts) {
    if (seen.size >= limit) break;
    const userId = raw?.user?.id ?? raw?.user_id;
    if (!userId || seen.has(String(userId))) continue;
    seen.add(String(userId));
    prefetchUserProfile(userId).catch(() => {});
  }
}

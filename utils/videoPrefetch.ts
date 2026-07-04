import { resolveVideoPlaybackUrl } from '@/utils/mediaUrl';
import { findRawPostInAppCache } from '@/utils/postCache';

const prefetchedUrls = new Set<string>();
const inFlightUrls = new Set<string>();

const MAX_CONCURRENT = 2;
const queue: string[] = [];

function resolveSegmentUrl(playlistUrl: string, line: string): string {
  if (line.startsWith('http://') || line.startsWith('https://')) {
    return line;
  }
  return new URL(line, playlistUrl).href;
}

/** Warm CDN cache: fetch HLS manifest + first segment, or video file head. */
async function warmVideoUrl(url: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return;

    const isHls =
      /\.m3u8(\?|$)/i.test(url) ||
      (res.headers.get('content-type') || '').includes('mpegurl');

    if (!isHls) return;

    const text = await res.text();
    const segmentLine = text
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith('#'));

    if (!segmentLine) return;

    const segmentUrl = resolveSegmentUrl(url, segmentLine);
    await fetch(segmentUrl, { signal: controller.signal }).catch(() => {});
  } catch {
    // Network/abort — prefetch is best-effort
  } finally {
    clearTimeout(timer);
  }
}

function drainPrefetchQueue(): void {
  while (inFlightUrls.size < MAX_CONCURRENT && queue.length > 0) {
    const url = queue.shift()!;
    if (prefetchedUrls.has(url) || inFlightUrls.has(url)) continue;

    inFlightUrls.add(url);
    warmVideoUrl(url)
      .then(() => {
        prefetchedUrls.add(url);
      })
      .catch(() => {})
      .finally(() => {
        inFlightUrls.delete(url);
        drainPrefetchQueue();
      });
  }
}

/** Buffer video (HLS manifest + first segment) in the background. */
export function prefetchVideoUrl(url?: string | null): void {
  if (!url) return;
  if (prefetchedUrls.has(url) || inFlightUrls.has(url) || queue.includes(url)) return;

  queue.push(url);
  drainPrefetchQueue();
}

export function prefetchVideoFromRawPost(post: any): void {
  const video = post?.media?.find((m: any) => m.media_type === 'video');
  if (!video) return;
  prefetchVideoUrl(resolveVideoPlaybackUrl(video));
}

export function prefetchVideoForPostId(postId: number): void {
  const cached = findRawPostInAppCache(postId);
  if (cached) {
    prefetchVideoFromRawPost(cached);
  }
}

/** Prefetch HLS for the active feed post and the next N video posts ahead. */
export function prefetchFeedVideos(
  posts: Array<{ id?: number; videoUrl?: string | null }>,
  activePostId: number | null,
  ahead = 2,
): void {
  if (!posts.length) return;

  const activeIndex =
    activePostId != null
      ? posts.findIndex((p) => Number(p.id) === Number(activePostId))
      : 0;
  const start = activeIndex >= 0 ? activeIndex : 0;

  if (posts[start]?.videoUrl) {
    prefetchVideoUrl(posts[start].videoUrl);
  }

  let buffered = 0;
  for (let i = start + 1; i < posts.length && buffered < ahead; i++) {
    const url = posts[i]?.videoUrl;
    if (url) {
      prefetchVideoUrl(url);
      buffered++;
    }
  }
}

/** Prefetch HLS for profile grid tiles that are on screen (+ a few ahead). */
export function prefetchProfileGridVideos(
  items: Array<{ postId: number; media_type: string }>,
  viewableItems: Array<{ index?: number | null; isViewable?: boolean }>,
  ahead = 3,
): void {
  const indices = viewableItems
    .filter((v) => v.isViewable && v.index != null)
    .map((v) => v.index as number);

  if (!indices.length) return;

  const maxIndex = Math.max(...indices);
  const end = Math.min(items.length - 1, maxIndex + ahead);

  for (let i = Math.min(...indices); i <= end; i++) {
    const item = items[i];
    if (item?.media_type === 'video') {
      prefetchVideoForPostId(item.postId);
    }
  }
}

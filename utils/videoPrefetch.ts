import { resolveMediaUrl, resolveVideoPlaybackUrl } from '@/utils/mediaUrl';
import { findRawPostInAppCache } from '@/utils/postCache';
import { prefetchFeedVideoMp4 } from '@/utils/feedVideoCache';

const prefetchedUrls = new Set<string>();
const inFlightUrls = new Set<string>();

// Instagram-style aggressive prefetch: warm many videos ahead so scrolling is
// instant. Nearest items are queued first (see prefetchFeedVideosFromIndex),
// so the currently-visible video is always prioritized before far-ahead ones.
const MAX_CONCURRENT = 4;
const SEGMENTS_TO_PREFETCH = 10;

/** How many upcoming video posts to warm in the main feed. */
export const FEED_PREFETCH_AHEAD = 30;
/** How many upcoming reels to warm in the fullscreen viewer. */
export const REELS_PREFETCH_AHEAD = 15;

const queue: string[] = [];

function resolveUrl(baseUrl: string, line: string): string {
  if (line.startsWith('http://') || line.startsWith('https://')) {
    return line;
  }
  return new URL(line, baseUrl).href;
}

function parseMasterVariantUrl(masterText: string, masterUrl: string): string | null {
  const lines = masterText.split('\n').map((l) => l.trim());
  let bestUrl: string | null = null;
  let lowestBandwidth = Infinity;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('#EXT-X-STREAM-INF:')) continue;

    const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/i);
    const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1], 10) : Infinity;
    const variantLine = lines[i + 1]?.trim();
    if (!variantLine || variantLine.startsWith('#')) continue;

    if (bandwidth < lowestBandwidth) {
      lowestBandwidth = bandwidth;
      bestUrl = resolveUrl(masterUrl, variantLine);
    }
  }

  return bestUrl;
}

function parseMediaSegmentUrls(mediaText: string, playlistUrl: string, limit: number): string[] {
  const segments: string[] = [];
  for (const raw of mediaText.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (/\.(ts|m4s|mp4)(\?|$)/i.test(line)) {
      segments.push(resolveUrl(playlistUrl, line));
      if (segments.length >= limit) break;
    }
  }
  return segments;
}

async function fetchText(url: string, signal: AbortSignal): Promise<string | null> {
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  return res.text();
}

/** Fetch master or media playlist, then warm first N HLS segments (lowest bitrate variant). */
async function warmVideoUrl(url: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const firstText = await fetchText(url, controller.signal);
    if (!firstText) return;

    const isMaster = firstText.includes('#EXT-X-STREAM-INF');

    let mediaPlaylistUrl = url;
    let mediaText = firstText;

    if (isMaster) {
      const variantUrl = parseMasterVariantUrl(firstText, url);
      if (!variantUrl) return;
      mediaPlaylistUrl = variantUrl;
      const variantText = await fetchText(variantUrl, controller.signal);
      if (!variantText) return;
      mediaText = variantText;
    }

    const segments = parseMediaSegmentUrls(mediaText, mediaPlaylistUrl, SEGMENTS_TO_PREFETCH);
    await Promise.allSettled(
      segments.map((segmentUrl) => fetch(segmentUrl, { signal: controller.signal })),
    );
  } catch {
    // Best-effort prefetch
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

/** Buffer HLS manifest + first segments in the background. */
export function prefetchVideoUrl(url?: string | null): void {
  if (!url) return;
  if (prefetchedUrls.has(url) || inFlightUrls.has(url) || queue.includes(url)) return;

  queue.push(url);
  drainPrefetchQueue();
}

export function prefetchVideoFromRawPost(post: any): void {
  const video = post?.media?.find((m: any) => m.media_type === 'video');
  if (!video) return;
  const postId = post?.id;
  const mp4Url = video?.url ? resolveMediaUrl(video.url) : null;
  if (postId && mp4Url) {
    prefetchFeedVideoMp4(Number(postId), mp4Url);
  }
  prefetchVideoUrl(resolveVideoPlaybackUrl(video));
}

export function prefetchVideoForPostId(postId: number): void {
  const cached = findRawPostInAppCache(postId);
  if (cached) {
    prefetchVideoFromRawPost(cached);
  }
}

/** Prefetch HLS for posts from startIndex through startIndex + ahead video posts. */
export function prefetchFeedVideosFromIndex(
  posts: Array<{ id?: number; videoUrl?: string | null; videoMp4Url?: string | null }>,
  startIndex: number,
  ahead = FEED_PREFETCH_AHEAD,
): void {
  if (!posts.length || startIndex < 0) return;

  let buffered = 0;
  for (let i = startIndex; i < posts.length && buffered <= ahead; i++) {
    const post = posts[i];
    if (!post?.videoUrl && !post?.videoMp4Url) continue;
    if (post.id && post.videoMp4Url) {
      prefetchFeedVideoMp4(post.id, post.videoMp4Url);
    }
    if (post.videoUrl) {
      prefetchVideoUrl(post.videoUrl);
    }
    buffered++;
  }
}

/** Prefetch HLS for the active feed post and the next N video posts ahead. */
export function prefetchFeedVideos(
  posts: Array<{ id?: number; videoUrl?: string | null; videoMp4Url?: string | null }>,
  activePostId: number | null,
  ahead = FEED_PREFETCH_AHEAD,
): void {
  if (!posts.length) return;

  const activeIndex =
    activePostId != null
      ? posts.findIndex((p) => Number(p.id) === Number(activePostId))
      : 0;
  const start = activeIndex >= 0 ? activeIndex : 0;
  prefetchFeedVideosFromIndex(posts, start, ahead);
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

import { useCallback, useEffect, useState } from 'react';
import {
  getCachedFeedVideoUri,
  pickFeedVideoPlaybackUrl,
  pinPostVideoForReplay,
  subscribeFeedVideoCached,
} from '@/utils/feedVideoCache';

/**
 * Resolves post video URL with disk cache for instant replay (feed, reels, profile).
 * If a local cache file is corrupt and cleared, falls back to the CDN URL.
 */
export function usePostVideoPlayback(
  postId: number | undefined,
  mp4Url?: string | null,
  hlsUrl?: string | null,
  enabled = true,
) {
  const [playbackUri, setPlaybackUri] = useState(() => {
    if (!postId || !enabled) return '';
    return getCachedFeedVideoUri(postId) ?? '';
  });

  useEffect(() => {
    if (!enabled || !postId || (!hlsUrl && !mp4Url)) {
      setPlaybackUri('');
      return;
    }

    let cancelled = false;
    const remoteFallback = mp4Url || hlsUrl || '';

    const cached = getCachedFeedVideoUri(postId);
    if (cached) {
      setPlaybackUri(cached);
    } else {
      pickFeedVideoPlaybackUrl(postId, mp4Url, hlsUrl).then((uri) => {
        if (!cancelled && uri) setPlaybackUri(uri);
      });
    }

    const unsub = subscribeFeedVideoCached(postId, (uri) => {
      if (cancelled) return;
      if (uri) {
        setPlaybackUri(uri);
        return;
      }
      // Cache invalidated (corrupt local file) — stream from CDN.
      setPlaybackUri(remoteFallback);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [enabled, postId, mp4Url, hlsUrl]);

  const onPlaybackStarted = useCallback(() => {
    if (postId && mp4Url) {
      pinPostVideoForReplay(postId, mp4Url);
    }
  }, [postId, mp4Url]);

  const isLocalPlayback = playbackUri.startsWith('file://');

  return { playbackUri, onPlaybackStarted, isLocalPlayback };
}

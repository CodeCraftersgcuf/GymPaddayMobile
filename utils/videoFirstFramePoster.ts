import * as VideoThumbnails from 'expo-video-thumbnails';

const frameCache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

/**
 * Local file URI of the video's first frame (time 0), for use as a poster while buffering.
 */
export async function getVideoFirstFramePosterUri(
  videoUrl: string,
): Promise<string | null> {
  const key = videoUrl.trim();
  if (!key) return null;

  const cached = frameCache.get(key);
  if (cached) return cached;

  const pending = inflight.get(key);
  if (pending) return pending;

  const task = (async () => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(key, {
        time: 0,
        quality: 0.65,
      });
      if (uri) frameCache.set(key, uri);
      return uri ?? null;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, task);
  return task;
}

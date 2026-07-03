import { MEDIA_CDN_URL } from '@/apiConfig';

/**
 * Media lives on R2/CDN. The API returns full URLs such as:
 * https://media.gympaddy.com/posts/10/1752516361_0_media_1752516358824_0.jpg
 *
 * Only prepends MEDIA_CDN_URL when the API sends a relative path.
 */
export function resolveMediaUrl(urlOrPath?: string | null): string | null {
  if (!urlOrPath) return null;

  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const relative = trimmed.replace(/^\/+/, '');
  return `${MEDIA_CDN_URL}/${relative}`;
}

export function resolveVideoPlaybackUrl(media?: {
  hls_url?: string | null;
  url?: string | null;
}): string | null {
  if (!media) return null;
  return resolveMediaUrl(media.hls_url) || resolveMediaUrl(media.url);
}

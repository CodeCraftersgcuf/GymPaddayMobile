import { MEDIA_CDN_URL } from '@/apiConfig';

const LEGACY_STORAGE_URL = /\/storage\/(.+)$/i;

/**
 * Media lives on R2/CDN. The API should return full CDN URLs.
 * Also handles legacy relative paths (marketplace_media/...) and old api/storage URLs.
 */
export function resolveMediaUrl(urlOrPath?: string | null): string | null {
  if (!urlOrPath) return null;

  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const legacy = trimmed.match(LEGACY_STORAGE_URL);
    if (legacy) {
      return `${MEDIA_CDN_URL}/${legacy[1].replace(/^\/+/, '')}`;
    }
    return trimmed;
  }

  const relative = trimmed.replace(/^\/?storage\//, '').replace(/^\/+/, '');
  return `${MEDIA_CDN_URL}/${relative}`;
}

export function resolveMediaUrls(urls?: Array<string | null> | null): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.map((url) => resolveMediaUrl(url)).filter(Boolean) as string[];
}

export function resolveVideoPlaybackUrl(media?: {
  hls_url?: string | null;
  url?: string | null;
}): string | null {
  if (!media) return null;
  return resolveMediaUrl(media.hls_url) || resolveMediaUrl(media.url);
}

import { MEDIA_CDN_URL, API_STORAGE_BASE } from '@/apiConfig';

const LEGACY_STORAGE_URL = /\/storage\/(.+)$/i;
const API_STORAGE_PREFIX = /^https?:\/\/api\.gympaddy\.com\/storage\/?/i;
const CHAT_IMAGE_PATH = /^chat_images\//i;
const CDN_CHAT_IMAGE = /^https?:\/\/media\.gympaddy\.com\/chat_images\//i;

const LOCAL_URI_PREFIXES = ['file://', 'content://', 'ph://', 'assets-library://', 'data:'];

function isLocalUri(value: string): boolean {
  return LOCAL_URI_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function toRelativeStoragePath(value: string): string {
  return value.replace(/^\/?storage\//, '').replace(/^\/+/, '');
}

/**
 * Chat images are often stored on the API server's public disk, not on the CDN.
 * resolveMediaUrl rewrites api.gympaddy.com/storage → media.gympaddy.com which 404s for chat_images.
 */
export function resolveChatImageUrl(urlOrPath?: string | null): string | null {
  if (!urlOrPath) return null;

  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  if (isLocalUri(trimmed)) return trimmed;

  if (CDN_CHAT_IMAGE.test(trimmed)) {
    const path = trimmed.replace(/^https?:\/\/media\.gympaddy\.com\//i, '');
    return `${API_STORAGE_BASE}/${path}`;
  }

  if (API_STORAGE_PREFIX.test(trimmed)) {
    return trimmed.replace(/\/+$/, '');
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const relative = toRelativeStoragePath(trimmed);
  if (CHAT_IMAGE_PATH.test(relative)) {
    return `${API_STORAGE_BASE}/${relative}`;
  }

  return resolveMediaUrl(urlOrPath);
}

/** CDN URL for chat images — used as fallback when API storage 404s (R2-only uploads). */
export function resolveChatImageCdnUrl(urlOrPath?: string | null): string | null {
  if (!urlOrPath) return null;
  const trimmed = urlOrPath.trim();
  if (!trimmed || isLocalUri(trimmed)) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (CDN_CHAT_IMAGE.test(trimmed)) return trimmed;
    const apiMatch = trimmed.match(API_STORAGE_PREFIX);
    if (apiMatch) {
      const path = toRelativeStoragePath(trimmed.replace(API_STORAGE_PREFIX, ''));
      return path ? `${MEDIA_CDN_URL}/${path}` : null;
    }
    return null;
  }

  const relative = toRelativeStoragePath(trimmed);
  return CHAT_IMAGE_PATH.test(relative) ? `${MEDIA_CDN_URL}/${relative}` : resolveMediaUrl(trimmed);
}

/**
 * Rewrite legacy api.gympaddy.com/storage/... URLs to media.gympaddy.com.
 * After R2 migration, files live on CDN only — local /storage on the API VPS 404s.
 */
export function resolveMediaUrl(urlOrPath?: string | null): string | null {
  if (!urlOrPath) return null;

  const trimmed = urlOrPath.trim().replace(/\/storage\/\/+/g, '/storage/');
  if (!trimmed) return null;

  // Local device URIs must never be rewritten to the CDN (optimistic story/post media).
  if (
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('ph://') ||
    trimmed.startsWith('assets-library://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (API_STORAGE_PREFIX.test(trimmed)) {
      const path = trimmed.replace(API_STORAGE_PREFIX, '').replace(/^\/+/, '');
      return path ? `${MEDIA_CDN_URL}/${path}` : null;
    }

    const legacy = trimmed.match(LEGACY_STORAGE_URL);
    if (legacy) {
      return `${MEDIA_CDN_URL}/${legacy[1].replace(/^\/+/, '')}`;
    }

    return trimmed;
  }

  const relative = trimmed.replace(/^\/?storage\//, '').replace(/^\/+/, '');
  return relative ? `${MEDIA_CDN_URL}/${relative}` : null;
}

export function resolveMediaUrls(urls?: Array<string | null> | null): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.map((url) => resolveMediaUrl(url)).filter(Boolean) as string[];
}

/** MP4 first for expo-av reliability; HLS when no progressive URL exists. */
export function resolveVideoPlaybackUrl(media?: {
  hls_url?: string | null;
  url?: string | null;
}): string | null {
  if (!media) return null;
  return resolveMediaUrl(media.url) || resolveMediaUrl(media.hls_url);
}

function sanitizeMediaItem(media: Record<string, unknown>): Record<string, unknown> {
  return {
    ...media,
    url: resolveMediaUrl(media.url as string) ?? media.url,
    hls_url: resolveMediaUrl(media.hls_url as string) ?? media.hls_url,
    thumbnail_url: resolveMediaUrl(media.thumbnail_url as string) ?? media.thumbnail_url,
    thumbnail: resolveMediaUrl(media.thumbnail as string) ?? media.thumbnail,
  };
}

/** Normalize CDN URLs on a raw API post before writing to React Query cache. */
export function sanitizeApiPost<T extends Record<string, unknown>>(post: T): T {
  if (!post || typeof post !== 'object') return post;

  const copy = { ...post } as T & { media?: unknown[]; user?: Record<string, unknown> };

  if (Array.isArray(copy.media)) {
    copy.media = copy.media.map((m) =>
      m && typeof m === 'object' ? sanitizeMediaItem(m as Record<string, unknown>) : m,
    );
  }

  if (copy.user && typeof copy.user === 'object') {
    copy.user = {
      ...copy.user,
      profile_picture_url:
        resolveMediaUrl(copy.user.profile_picture_url as string) ??
        copy.user.profile_picture_url,
    };
  }

  return copy as T;
}

/** True when every media item has a playable CDN URL (or post has no media). */
export function isPostMediaReady(post: Record<string, unknown> | null | undefined): boolean {
  const media = post?.media;
  if (!Array.isArray(media) || media.length === 0) return true;

  return media.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const m = item as { url?: string; hls_url?: string; media_type?: string };
    if (m.media_type === 'video') {
      return Boolean(resolveMediaUrl(m.url) || resolveMediaUrl(m.hls_url));
    }
    return Boolean(resolveMediaUrl(m.url));
  });
}

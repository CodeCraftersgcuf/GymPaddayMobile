import type { StoryItem } from '@/utils/types/story';

/**
 * In-memory sticky store for the current user's own stories that are still
 * processing. Survives query refetches so the stories ring does not blink
 * (appear → vanish) while CDN media is not ready yet.
 */
const pendingByUser = new Map<string, Map<number, StoryItem>>();

/** Last known auth user id — avoids StoryContainer waiting on SecureStore. */
let lastAuthUserId: number | string | null = null;

export function setLastAuthUserId(userId: number | string | null | undefined): void {
  if (userId != null) lastAuthUserId = userId;
}

export function getLastAuthUserId(): number | string | null {
  return lastAuthUserId;
}

function userKey(userId: number | string): string {
  return String(userId);
}

export function rememberPendingMyStory(userId: number | string, story: StoryItem): void {
  setLastAuthUserId(userId);
  const key = userKey(userId);
  let map = pendingByUser.get(key);
  if (!map) {
    map = new Map();
    pendingByUser.set(key, map);
  }
  map.set(Number(story.id), story);
}

export function clearPendingMyStory(userId: number | string, storyId: number | string): void {
  pendingByUser.get(userKey(userId))?.delete(Number(storyId));
}

export function clearPendingMyStoriesForUser(userId: number | string): void {
  pendingByUser.delete(userKey(userId));
}

export function getPendingMyStories(userId: number | string | null | undefined): StoryItem[] {
  if (userId == null) return [];
  const map = pendingByUser.get(userKey(userId));
  if (!map?.size) return [];
  return Array.from(map.values());
}

/** Drop pending entries that now have a ready CDN URL from the server. */
export function reconcilePendingMyStories(
  userId: number | string | null | undefined,
  serverMineRaw: StoryItem[],
): void {
  if (userId == null) return;
  setLastAuthUserId(userId);
  const map = pendingByUser.get(userKey(userId));
  if (!map?.size) return;

  for (const story of serverMineRaw) {
    const id = Number(story.id);
    const status = (story as StoryItem & { processing_status?: string }).processing_status;
    const url = story.full_media_url;
    const isRemote =
      typeof url === 'string' &&
      (url.startsWith('http://') || url.startsWith('https://'));

    if (status === 'ready' && isRemote) {
      map.delete(id);
    }
    if (status === 'failed') {
      map.delete(id);
    }
  }

  if (map.size === 0) pendingByUser.delete(userKey(userId));
}

import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '@/apiConfig';
import { GroupedUserStories, StoryItem } from '@/utils/types/story';
import { groupStoriesByUser } from '@/utils/groupStories';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import type { QueryClient } from '@tanstack/react-query';
import { queryClient } from '@/utils/queryClient';
import {
  getPendingMyStories,
  reconcilePendingMyStories,
} from '@/utils/pendingMyStories';

function normalizeStory(story: StoryItem): StoryItem {
  const raw = story as StoryItem & {
    is_followed?: boolean;
    music_url?: string | null;
    music_title?: string | null;
    music_artist?: string | null;
  };
  const musicUrl = raw.music_url ? resolveMediaUrl(raw.music_url) || raw.music_url : null;
  return {
    ...story,
    is_followed: Boolean(raw.is_followed),
    music_url: musicUrl,
    music_title: raw.music_title ?? null,
    music_artist: raw.music_artist ?? null,
    full_media_url: resolveMediaUrl(story.full_media_url) || story.full_media_url,
    full_thumbnail_url:
      resolveMediaUrl((story as StoryItem & { full_thumbnail_url?: string }).full_thumbnail_url) ||
      (story as StoryItem & { full_thumbnail_url?: string }).full_thumbnail_url ||
      null,
    user: {
      ...story.user,
      profile_picture_url:
        resolveMediaUrl(story.user?.profile_picture_url) ||
        story.user?.profile_picture_url ||
        '',
    },
  };
}

/** Stories still processing have no CDN media yet — hide those without a playable URL. */
export function filterReadyStories(stories: StoryItem[]): StoryItem[] {
  return stories.filter((story) => {
    const status = (story as StoryItem & { processing_status?: string }).processing_status;
    if (status === 'failed') return false;
    if (status && status !== 'ready' && !story.full_media_url) return false;
    return Boolean(story.full_media_url);
  });
}

function mergeMyStories(
  serverMine: StoryItem[],
  cached: GroupedUserStories[] | undefined,
  myUserId: number | string | null,
  pending: StoryItem[],
): StoryItem[] {
  const byId = new Map<number, StoryItem>();

  for (const story of serverMine) {
    byId.set(Number(story.id), story);
  }

  const mineFromCache =
    myUserId != null
      ? cached?.find((g) => String(g.user.id) === String(myUserId))
      : undefined;

  const extras = [
    ...(mineFromCache?.stories ?? []),
    ...pending,
  ];

  for (const story of extras) {
    const id = Number(story.id);
    if (!story.full_media_url && !byId.has(id)) continue;

    if (!byId.has(id)) {
      byId.set(id, story);
      continue;
    }

    const server = byId.get(id)!;
    byId.set(id, {
      ...story,
      ...server,
      music_url: server.music_url || story.music_url,
      music_title: server.music_title || story.music_title,
      music_artist: server.music_artist || story.music_artist,
      // Keep local/file URI while CDN is still null (stops ring blink).
      full_media_url: server.full_media_url || story.full_media_url,
      full_thumbnail_url: server.full_thumbnail_url || story.full_thumbnail_url,
      processing_status: server.processing_status || story.processing_status,
    });
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

async function resolveMyUserId(
  serverMine: StoryItem[],
  myStoriesRaw: any[],
): Promise<number | string | null> {
  const fromServer = serverMine[0]?.user?.id ?? myStoriesRaw[0]?.user?.id ?? null;
  if (fromServer != null) return fromServer;

  try {
    const raw = await SecureStore.getItemAsync('user_data');
    if (raw) {
      const id = JSON.parse(raw)?.id;
      if (id != null) return id;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function fetchGroupedStories(token: string): Promise<GroupedUserStories[]> {
  const response = await fetch(API_ENDPOINTS.USER.STORIES.List, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to load stories (${response.status})`);
  }

  const json = await response.json();
  const { stories = [], my_stories = [] } = json;

  const cached = queryClient.getQueryData<GroupedUserStories[]>(['groupedStories']);
  const normalizedMine = my_stories.map(normalizeStory);
  const readyStories = filterReadyStories(stories.map(normalizeStory));
  const serverMine = filterReadyStories(normalizedMine);
  const myUserId = await resolveMyUserId(serverMine, my_stories);

  reconcilePendingMyStories(myUserId, normalizedMine);
  const pending = getPendingMyStories(myUserId);
  const readyMyStories = mergeMyStories(serverMine, cached, myUserId, pending);

  return [
    ...groupStoriesByUser(readyMyStories),
    ...groupStoriesByUser(readyStories),
  ];
}

export async function deleteStory(token: string, storyId: number): Promise<void> {
  const response = await fetch(API_ENDPOINTS.USER.STORIES.Delete(storyId), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  let body: any;
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (!response.ok) {
    throw new Error(body?.message || `Failed to delete story (${response.status})`);
  }
}

/** Remove a story from the groupedStories cache after delete. */
export function removeStoryFromGroupedCache(
  queryClient: QueryClient,
  storyId: number,
  userId?: number | string,
): void {
  queryClient.setQueryData<GroupedUserStories[]>(['groupedStories'], (old) => {
    if (!old) return old;
    return old
      .map((group) => {
        if (userId != null && String(group.user.id) !== String(userId)) {
          return group;
        }
        return {
          ...group,
          stories: group.stories.filter((s) => s.id !== storyId),
        };
      })
      .filter((group) => group.stories.length > 0);
  });
}

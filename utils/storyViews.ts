import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '@/apiConfig';

const VIEWED_KEY = 'gympaddy:viewed_stories';

export async function getViewedStoryIds(): Promise<Set<number>> {
  try {
    const raw = await AsyncStorage.getItem(VIEWED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map(Number) : []);
  } catch {
    return new Set();
  }
}

export async function markStoryViewed(storyId: number): Promise<void> {
  if (!storyId) return;

  const viewed = await getViewedStoryIds();
  if (viewed.has(storyId)) return;
  viewed.add(storyId);

  const ids = Array.from(viewed).slice(-500);
  await AsyncStorage.setItem(VIEWED_KEY, JSON.stringify(ids));

  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  fetch(`${API_ENDPOINTS.USER.STORIES.View}/${storyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

export function sortGroupedStoriesUnseenFirst<T extends {
  stories?: Array<{ viewed_by_me?: boolean; id: number; is_followed?: boolean }>;
}>(
  groups: T[],
  viewedIds?: Set<number>,
): T[] {
  return [...groups].sort((a, b) => {
    const aScore = groupSortScore(a, viewedIds);
    const bScore = groupSortScore(b, viewedIds);
    return bScore - aScore;
  });
}

function groupSortScore(
  group: { stories?: Array<{ viewed_by_me?: boolean; id: number; is_followed?: boolean }> },
  viewedIds?: Set<number>,
): number {
  const isFollowed = group.stories?.some((s) => s.is_followed) ?? false;
  const unseen = hasUnseenStories(group, viewedIds);
  if (isFollowed && unseen) return 4;
  if (!isFollowed && unseen) return 3;
  if (isFollowed && !unseen) return 2;
  return 1;
}

function hasUnseenStories(
  group: { stories?: Array<{ viewed_by_me?: boolean; id: number }> },
  viewedIds?: Set<number>,
): boolean {
  const stories = group.stories ?? [];
  return stories.some((s) => {
    if (s.viewed_by_me === true) return false;
    if (viewedIds?.has(s.id)) return false;
    return true;
  });
}

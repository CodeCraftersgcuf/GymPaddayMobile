import * as SecureStore from 'expo-secure-store';
import { API_ENDPOINTS } from '@/apiConfig';
import { queryClient } from '@/utils/queryClient';
import type { StoryMusic } from '@/constants/storyMusic';
import { STORY_MUSIC_LIBRARY } from '@/constants/storyMusic';

export async function fetchStoryMusicLibrary(): Promise<StoryMusic[]> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return STORY_MUSIC_LIBRARY;

  try {
    const res = await fetch(API_ENDPOINTS.USER.STORIES.Music, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) return STORY_MUSIC_LIBRARY;
    const json = await res.json();
    const tracks = json?.tracks ?? json?.data?.tracks ?? [];
    if (!Array.isArray(tracks) || tracks.length === 0) return STORY_MUSIC_LIBRARY;

    return tracks.map((t: any) => ({
      id: String(t.id),
      title: t.title ?? 'Track',
      artist: t.artist ?? 'GymPaddy',
      preview: t.preview ?? t.preview_url ?? '',
      duration: t.duration ?? t.duration_seconds ?? 15,
      genre: t.genre ?? undefined,
    }));
  } catch {
    return STORY_MUSIC_LIBRARY;
  }
}

export async function prefetchStoryMusicLibrary(): Promise<StoryMusic[]> {
  const tracks = await fetchStoryMusicLibrary();
  queryClient.setQueryData(['storyMusicLibrary'], tracks);
  return tracks;
}

import * as FileSystem from 'expo-file-system/legacy';
import type { QueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/apiConfig';
import type { GroupedUserStories, StoryItem } from '@/utils/types/story';
import { rememberPendingMyStory } from '@/utils/pendingMyStories';

type StoryMedia = {
  id: string | number;
  uri: string;
  mediaType: string;
  trimStart?: number;
  trimDuration?: number;
};

type StoryMusic = {
  title?: string;
  preview?: string;
  artist?: string;
};

export async function uploadStoryMedia(
  media: StoryMedia,
  token: string,
  music?: StoryMusic | null,
): Promise<any> {
  const isVideo = media.mediaType === 'video';
  const uploadUrl = API_ENDPOINTS.USER.STORIES.Create;

  const parameters: Record<string, string> = {
    media_type: media.mediaType,
    caption: '',
  };

  if (music?.title && music?.preview) {
    parameters.music_title = music.title;
    parameters.music_url = music.preview;
    if (music.artist) parameters.music_artist = music.artist;
  }

  if (
    isVideo &&
    typeof media.trimStart === 'number' &&
    typeof media.trimDuration === 'number' &&
    media.trimDuration > 0
  ) {
    parameters.trim_start = String(media.trimStart);
    parameters.trim_duration = String(media.trimDuration);
  }

  const uploadResult = await FileSystem.uploadAsync(uploadUrl, media.uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'media',
    mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
    parameters,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  let result: any;
  try {
    result = JSON.parse(uploadResult.body);
  } catch {
    throw new Error('Invalid server response');
  }

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(result?.message || 'Upload failed');
  }

  return result;
}

/** Show the new story in the ring immediately while server processing finishes. */
export function optimisticallyAddMyStory(
  queryClient: QueryClient,
  storyPayload: any,
  localUri: string,
  user: { id: number; username?: string; profile_picture_url?: string },
): void {
  const story = storyPayload?.story;
  if (!story?.id) return;

  const optimistic: StoryItem = {
    id: story.id,
    user_id: user.id,
    media_url: story.media_url,
    media_type: story.media_type === 'video' ? 'video' : 'photo',
    caption: story.caption ?? null,
    full_media_url: localUri,
    full_thumbnail_url: localUri,
    processing_status: story.processing_status ?? 'processing',
    viewed_by_me: true,
    created_at: story.created_at ?? new Date().toISOString(),
    expires_at: story.expires_at ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: user.id,
      username: user.username ?? 'You',
      fullname: user.username ?? 'You',
      email: '',
      profile_picture_url: user.profile_picture_url ?? '',
    },
  };

  // Sticky across refetches — query cache alone was getting wiped for ~1s.
  rememberPendingMyStory(user.id, optimistic);

  queryClient.setQueryData<GroupedUserStories[]>(['groupedStories'], (old) => {
    const groups = old ?? [];
    const mineIdx = groups.findIndex((g) => String(g.user.id) === String(user.id));
    if (mineIdx >= 0) {
      const next = [...groups];
      const existing = next[mineIdx].stories.filter((s) => Number(s.id) !== Number(optimistic.id));
      next[mineIdx] = { ...next[mineIdx], stories: [optimistic, ...existing] };
      return next;
    }
    return [
      { user: optimistic.user, stories: [optimistic] },
      ...groups,
    ];
  });
}

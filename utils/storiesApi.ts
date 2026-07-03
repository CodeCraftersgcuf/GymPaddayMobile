import { API_ENDPOINTS } from '@/apiConfig';
import { GroupedUserStories, StoryItem } from '@/utils/types/story';
import { groupStoriesByUser } from '@/utils/groupStories';
import { resolveMediaUrl } from '@/utils/mediaUrl';

function normalizeStory(story: StoryItem): StoryItem {
  return {
    ...story,
    full_media_url: resolveMediaUrl(story.full_media_url) || story.full_media_url,
    user: {
      ...story.user,
      profile_picture_url:
        resolveMediaUrl(story.user?.profile_picture_url) ||
        story.user?.profile_picture_url ||
        '',
    },
  };
}

/** Stories still processing have no playable media yet — hide from the public ring list. */
export function filterReadyStories(stories: StoryItem[]): StoryItem[] {
  return stories.filter((story) => {
    const status = (story as StoryItem & { processing_status?: string }).processing_status;
    if (status && status !== 'ready') return false;
    return Boolean(story.full_media_url);
  });
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

  const readyStories = filterReadyStories(stories.map(normalizeStory));
  const readyMyStories = filterReadyStories(my_stories.map(normalizeStory));

  return [
    ...groupStoriesByUser(readyMyStories),
    ...groupStoriesByUser(readyStories),
  ];
}

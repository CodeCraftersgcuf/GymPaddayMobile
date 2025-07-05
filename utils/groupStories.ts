// import { StoryItem, GroupedUserStories } from '@/types/story';

import { GroupedUserStories, StoryItem } from "./types/story";

export function groupStoriesByUser(stories: StoryItem[]): GroupedUserStories[] {
  const userMap = new Map<number, GroupedUserStories>();

  for (const story of stories) {
    const userId = story.user.id;

    if (!userMap.has(userId)) {
      userMap.set(userId, {
        user: story.user,
        stories: [story],
      });
    } else {
      userMap.get(userId)!.stories.push(story);
    }
  }

  return Array.from(userMap.values());
}

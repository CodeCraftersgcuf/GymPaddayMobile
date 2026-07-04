import type { Router } from 'expo-router';
import { prefetchUserProfilePages } from '@/utils/prefetchNavigation';

export type ProfilePreview = {
  user_id: string | number;
  username?: string;
  profile_picture?: string;
};

export async function prefetchUserProfile(userId: string | number): Promise<void> {
  await prefetchUserProfilePages(userId, 2);
}

export function navigateToUserProfile(router: Router, preview: ProfilePreview): void {
  const userId = String(preview.user_id);

  prefetchUserProfile(userId).catch(() => {});

  router.push({
    pathname: '/UserProfile',
    params: {
      user_id: userId,
      ...(preview.username ? { username: preview.username } : {}),
      ...(preview.profile_picture ? { profile_picture: preview.profile_picture } : {}),
    },
  });
}

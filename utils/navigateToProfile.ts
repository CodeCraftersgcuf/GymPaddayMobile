import type { Router } from 'expo-router';
import { prefetchUserProfilePages } from '@/utils/prefetchNavigation';

export type ProfilePreview = {
  user_id: string | number;
  username?: string;
  profile_picture?: string;
};

export async function prefetchUserProfile(userId: string | number): Promise<void> {
  try {
    await prefetchUserProfilePages(userId, 1);
  } catch (err: any) {
    if (err?.statusCode !== 403 && err?.statusCode !== 401) {
      throw err;
    }
  }
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

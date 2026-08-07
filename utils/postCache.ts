import { queryClient } from '@/utils/queryClient';
import { sanitizeApiPost } from '@/utils/mediaUrl';

export const postQueryKey = (postId: number | string) => ['post', Number(postId)] as const;

function collectRawPostsFromInfinite(keyRoot: string): any[] {
  const queries = queryClient.getQueriesData<{ pages?: Array<Record<string, any>> }>({
    queryKey: [keyRoot],
  });

  const posts: any[] = [];
  for (const [, data] of queries) {
    if (!data?.pages) continue;
    for (const page of data.pages) {
      if (Array.isArray(page?.data)) {
        posts.push(...page.data);
      }
      if (Array.isArray(page?.posts)) {
        posts.push(...page.posts);
      }
    }
  }
  return posts;
}

/** Find a raw API post object already in React Query cache (feed, profile, or post key). */
export function findRawPostInAppCache(postId: number): any | undefined {
  const id = Number(postId);
  if (!id) return undefined;

  const direct = queryClient.getQueryData<any>(postQueryKey(id));
  if (direct?.id != null) {
    return direct;
  }

  const fromFeed = collectRawPostsFromInfinite('userPosts').find((p) => Number(p?.id) === id);
  if (fromFeed) return fromFeed;

  const fromProfiles = collectRawPostsFromInfinite('userProfile').find(
    (p) => Number(p?.id) === id,
  );
  if (fromProfiles) return fromProfiles;

  return undefined;
}

/** Seed per-post cache entries so SinglePostScreen opens instantly. */
export function seedPostCaches(rawPosts: any[] | undefined): void {
  if (!Array.isArray(rawPosts)) return;

  for (const post of rawPosts) {
    const id = Number(post?.id);
    if (!id) continue;
    queryClient.setQueryData(postQueryKey(id), sanitizeApiPost(post));
  }
}

export function seedPostCache(post: any): void {
  const id = Number(post?.id);
  if (!id) return;
  queryClient.setQueryData(postQueryKey(id), sanitizeApiPost(post));
}

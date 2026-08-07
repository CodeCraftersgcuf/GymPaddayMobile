import type { QueryClient } from "@tanstack/react-query";
import * as SecureStore from 'expo-secure-store';
import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";
import { FEED_PAGE_SIZE } from "../feedPagination";
import { clearCachedFeedVideo } from '@/utils/feedVideoCache';
import { queryClient } from '@/utils/queryClient';
import { sanitizeApiPost } from '@/utils/mediaUrl';

type InfiniteFeedCache = {
  pages?: Array<{ data?: unknown[] } & Record<string, unknown>>;
  pageParams?: unknown[];
};

/** Posts we know are live but may be missing from a stale server feed page. */
const recentlyPublished = new Map<number, Record<string, unknown>>();

function feedHasPost(o: InfiniteFeedCache | undefined, postId: number): boolean {
  return Boolean(
    o?.pages?.some(
      (page) =>
        Array.isArray(page?.data) &&
        page.data.some((p: Record<string, unknown>) => Number(p?.id) === postId),
    ),
  );
}

export function rememberPublishedPost(post: Record<string, unknown>): void {
  const clean = sanitizeApiPost(post);
  const pid = Number(clean.id);
  if (!Number.isFinite(pid)) return;
  recentlyPublished.set(pid, clean);
  while (recentlyPublished.size > 20) {
    const oldest = recentlyPublished.keys().next().value;
    if (oldest == null) break;
    recentlyPublished.delete(oldest);
  }
}

export function forgetPublishedPost(postId: number): void {
  recentlyPublished.delete(postId);
}

/** Re-insert posts the server feed hasn't caught up with yet (after refetch). */
export function mergeRecentlyPublishedIntoFeedCache(client: QueryClient = queryClient): void {
  if (recentlyPublished.size === 0) return;

  const snapshot = client.getQueryData<InfiniteFeedCache>(['userPosts']);
  const idsInFeed = new Set<number>();
  snapshot?.pages?.forEach((page) => {
    page?.data?.forEach((p: Record<string, unknown>) => {
      const id = Number(p?.id);
      if (Number.isFinite(id)) idsInFeed.add(id);
    });
  });

  for (const [postId, post] of recentlyPublished) {
    if (idsInFeed.has(postId)) {
      recentlyPublished.delete(postId);
      continue;
    }
    prependPostToUserPostsInfiniteCache(client, post);
  }
}

/** Insert a newly published post at the top of the home feed cache. */
export function prependPostToUserPostsInfiniteCache(
  queryClient: QueryClient,
  serverPost: Record<string, unknown> | null | undefined,
) {
  const clean = serverPost ? sanitizeApiPost(serverPost) : null;
  const pid = Number(clean?.id);
  if (!Number.isFinite(pid) || !clean || typeof clean !== "object") return;

  queryClient.setQueryData(['userPosts'], (old: unknown) => {
    const o = old as InfiniteFeedCache | undefined;

    if (!o?.pages?.length) {
      return {
        pages: [{ data: [clean], current_page: 1, next_page_url: null }],
        pageParams: [1],
      };
    }

    if (feedHasPost(o, pid)) return o;

    return {
      ...o,
      pages: o.pages.map((page, index) => {
        if (index !== 0 || !Array.isArray(page?.data)) return page;
        return {
          ...page,
          data: [clean, ...page.data],
        };
      }),
    };
  });
}

export function removePostFromUserPostsInfiniteCache(
  queryClient: QueryClient,
  postId: number,
) {
  const pid = Number(postId);
  if (!Number.isFinite(pid)) return;
  forgetPublishedPost(pid);

  queryClient.setQueryData(['userPosts'], (old: unknown) => {
    const o = old as InfiniteFeedCache | undefined;
    if (!o?.pages) return old;
    return {
      ...o,
      pages: o.pages.map((page) => {
        if (!Array.isArray(page?.data)) return page;
        return {
          ...page,
          data: page.data.filter(
            (p: Record<string, unknown>) => Number(p?.id) !== pid,
          ),
        };
      }),
    };
  });
}

export function patchPostInUserPostsInfiniteCache(
  queryClient: QueryClient,
  postId: string | number,
  serverPost: Record<string, unknown> | null | undefined,
) {
  const clean = serverPost ? sanitizeApiPost(serverPost) : null;
  const pid = Number(postId);
  if (!Number.isFinite(pid) || !clean || typeof clean !== "object") return;

  queryClient.setQueryData(['userPosts'], (old: unknown) => {
    const o = old as InfiniteFeedCache | undefined;
    if (!o?.pages?.length) {
      return {
        pages: [{ data: [clean], current_page: 1, next_page_url: null }],
        pageParams: [1],
      };
    }

    if (!feedHasPost(o, pid)) {
      return {
        ...o,
        pages: o.pages.map((page, index) => {
          if (index !== 0 || !Array.isArray(page?.data)) return page;
          return { ...page, data: [clean, ...page.data] };
        }),
      };
    }

    return {
      ...o,
      pages: o.pages.map((page) => {
        const list = page?.data;
        if (!Array.isArray(list)) return page;
        return {
          ...page,
          data: list.map((p: Record<string, unknown>) => {
            if (Number(p?.id) !== pid) return p;
            return {
              ...p,
              title: clean.title ?? p.title,
              content: clean.content ?? p.content,
              media: clean.media ?? p.media,
              publish_status: clean.publish_status ?? p.publish_status,
              updated_at: clean.updated_at ?? p.updated_at,
            };
          }),
        };
      }),
    };
  });
}

export const getUserPosts = async (
  token: string,
  page: number = 1,
  limit: number = FEED_PAGE_SIZE,
): Promise<any> => {
  const url = `${API_ENDPOINTS.USER.POSTS.List}?page=${page}&limit=${limit}`;
  const response = await apiCall(url, "GET", undefined, token);
  if (Array.isArray(response?.data)) {
    response.data = response.data.map((post: Record<string, unknown>) => sanitizeApiPost(post));
  }
  return response;
};


export const getPostById = async (id: number, token: string): Promise<any> => {
  const post = await apiCall(API_ENDPOINTS.USER.POSTS.Show(id), "GET", undefined, token);
  return sanitizeApiPost(post);
};

/** Remove a post from the local feed when the server no longer has it (failed/deleted upload). */
export async function removePostFromFeedIfDeleted(postId: number): Promise<boolean> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return false;

  try {
    await getPostById(postId, token);
    return false;
  } catch (error: any) {
    const status = error?.response?.status ?? error?.statusCode;
    if (status !== 404 && status !== 410) return false;
    forgetPublishedPost(postId);
    removePostFromUserPostsInfiniteCache(queryClient, postId);
    clearCachedFeedVideo(postId);
    return true;
  }
}

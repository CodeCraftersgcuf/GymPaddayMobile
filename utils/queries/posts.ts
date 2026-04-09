import type { QueryClient } from "@tanstack/react-query";
import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

/** Merge an updated post into all `userPosts` infinite-query pages so the home feed updates immediately. */
export function patchPostInUserPostsInfiniteCache(
  queryClient: QueryClient,
  postId: string | number,
  serverPost: Record<string, unknown> | null | undefined
) {
  const pid = Number(postId);
  if (!Number.isFinite(pid) || !serverPost || typeof serverPost !== "object") return;

  queryClient.setQueriesData({ queryKey: ["userPosts"] }, (old: unknown) => {
    const o = old as { pages?: Array<{ data?: unknown[] } & Record<string, unknown>> } | undefined;
    if (!o?.pages) return old;
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
              title: serverPost.title ?? p.title,
              content: serverPost.content ?? p.content,
              media: serverPost.media ?? p.media,
              updated_at: serverPost.updated_at ?? p.updated_at,
            };
          }),
        };
      }),
    };
  });
}

export const getUserPosts = async (token: string, page: number = 1, limit: number = 4): Promise<any> => {
  const url = `${API_ENDPOINTS.USER.POSTS.List}?page=${page}&limit=${limit}`;
  return await apiCall(url, "GET", undefined, token);
};


export const getPostById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.POSTS.Show(id), "GET", undefined, token);
};

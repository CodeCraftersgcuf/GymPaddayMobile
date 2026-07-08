import { useCallback, useEffect, useReducer } from 'react';

export type LikeEntry = { liked: boolean; count: number };

// Module-level store shared across the whole app so the feed, the reels viewer
// and any single-post screen reflect the same like state. The backend feed is
// server-cached and does NOT report whether the current user liked a post, so
// once the user interacts we remember it here to keep every surface in sync.
const store = new Map<number, LikeEntry>();
const listeners = new Map<number, Set<() => void>>();

function emit(postId: number): void {
  const set = listeners.get(postId);
  if (set) set.forEach((cb) => cb());
}

export function getLikeEntry(postId: number): LikeEntry | undefined {
  return store.get(postId);
}

export function setLikeEntry(postId: number, entry: LikeEntry): void {
  store.set(postId, entry);
  emit(postId);
}

function subscribe(postId: number, cb: () => void): () => void {
  let set = listeners.get(postId);
  if (!set) {
    set = new Set();
    listeners.set(postId, set);
  }
  set.add(cb);
  return () => {
    set!.delete(cb);
    if (set!.size === 0) listeners.delete(postId);
  };
}

/**
 * Shared like state for a post. `initialLiked` / `initialCount` seed the value
 * only until a like/unlike is recorded in the store; after that the stored
 * value wins so the feed and reels never disagree.
 */
export function useLikeState(
  postId: number,
  initialLiked: boolean,
  initialCount: number,
) {
  const [, force] = useReducer((x: number) => x + 1, 0);

  useEffect(() => subscribe(postId, force), [postId]);

  const entry = store.get(postId);
  const liked = entry ? entry.liked : initialLiked;
  const count = entry ? entry.count : initialCount;

  const setLike = useCallback(
    (nextLiked: boolean, nextCount: number) => {
      setLikeEntry(postId, { liked: nextLiked, count: Math.max(0, nextCount) });
    },
    [postId],
  );

  return { liked, count, setLike };
}

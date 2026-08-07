import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getPostById, patchPostInUserPostsInfiniteCache, prependPostToUserPostsInfiniteCache, removePostFromUserPostsInfiniteCache, rememberPublishedPost, mergeRecentlyPublishedIntoFeedCache } from '@/utils/queries/posts';
import { queryClient } from '@/utils/queryClient';
import { clearCachedFeedVideo } from '@/utils/feedVideoCache';
import { isPostMediaReady } from '@/utils/mediaUrl';

const STORAGE_KEY = 'gympaddy_pending_posts_v2';

export type PendingPostStatus = 'uploading' | 'processing' | 'failed';

export type PendingPost = {
  clientId: string;
  userId: number;
  postId?: number;
  status: PendingPostStatus;
  createdAt: number;
  caption?: string;
  thumbnailUri?: string | null;
  errorMessage?: string;
  uploadProgress?: number;
};

const pending = new Map<string, PendingPost>();
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  listeners.forEach((cb) => cb());
}

async function persist() {
  const items = Array.from(pending.values());
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function normalizeStoredItem(raw: any): PendingPost | null {
  if (!raw) return null;
  const postId = raw.postId != null ? Number(raw.postId) : undefined;
  const userId = Number(raw.userId);
  const clientId =
    typeof raw.clientId === 'string'
      ? raw.clientId
      : postId != null && Number.isFinite(postId)
        ? `post-${postId}`
        : null;
  if (!clientId || !Number.isFinite(userId)) return null;

  const status: PendingPostStatus =
    raw.status === 'uploading' || raw.status === 'processing' || raw.status === 'failed'
      ? raw.status
      : 'processing';

  return {
    clientId,
    userId,
    postId: Number.isFinite(postId) ? postId : undefined,
    status,
    createdAt: Number(raw.createdAt) || Date.now(),
    caption: raw.caption,
    thumbnailUri: raw.thumbnailUri ?? null,
    errorMessage: raw.errorMessage,
    uploadProgress:
      typeof raw.uploadProgress === 'number' ? raw.uploadProgress : undefined,
  };
}

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const items: PendingPost[] = JSON.parse(raw);
      items.forEach((item) => {
        const normalized = normalizeStoredItem(item);
        if (normalized) pending.set(normalized.clientId, normalized);
      });
      return;
    }

    const legacyRaw = await AsyncStorage.getItem('gympaddy_pending_posts_v1');
    if (!legacyRaw) return;
    await AsyncStorage.removeItem('gympaddy_pending_posts_v1');
  } catch {
    /* noop */
  }
}

export async function getCurrentUserId(): Promise<number | null> {
  try {
    const raw = await SecureStore.getItemAsync('user_data');
    if (!raw) return null;
    const userId = Number(JSON.parse(raw)?.id);
    return Number.isFinite(userId) ? userId : null;
  } catch {
    return null;
  }
}

export function subscribePendingPosts(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function getPendingPostsForUser(userId: number): Promise<PendingPost[]> {
  await hydrate();
  return Array.from(pending.values())
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function addPendingPost(entry: PendingPost): Promise<void> {
  await hydrate();
  pending.set(entry.clientId, entry);
  await persist();
  emit();
}

export async function updatePendingPost(
  clientId: string,
  patch: Partial<PendingPost>,
): Promise<void> {
  await hydrate();
  const existing = pending.get(clientId);
  if (!existing) return;
  pending.set(clientId, { ...existing, ...patch, clientId, userId: existing.userId });
  await persist();
  emit();
}

/** In-memory progress updates — avoids writing to disk on every tick. */
let lastProgressEmitAt = 0;
export function updatePendingPostProgress(clientId: string, uploadProgress: number): void {
  const existing = pending.get(clientId);
  if (!existing || existing.status !== 'uploading') return;
  const next = Math.min(99, Math.max(0, Math.round(uploadProgress)));
  pending.set(clientId, {
    ...existing,
    uploadProgress: next,
  });
  const now = Date.now();
  // Throttle UI refreshes — rapid FlatList updates during upload can destabilize Expo Go.
  if (next < 99 && now - lastProgressEmitAt < 500) return;
  lastProgressEmitAt = now;
  emit();
}

export async function resolvePendingUpload(clientId: string, postId: number): Promise<void> {
  await updatePendingPost(clientId, { postId, status: 'processing', uploadProgress: 100 });
}

export async function markPendingFailed(clientId: string, errorMessage?: string): Promise<void> {
  await updatePendingPost(clientId, { status: 'failed', errorMessage });
}

export async function removePendingPost(clientId: string): Promise<void> {
  await hydrate();
  if (!pending.delete(clientId)) return;
  await persist();
  emit();
}

export async function removePendingPostByPostId(postId: number): Promise<void> {
  await hydrate();
  const match = Array.from(pending.values()).find((item) => item.postId === postId);
  if (!match) return;
  await removePendingPost(match.clientId);
}

/** Remove pending uploads that belong to another account (or legacy entries without userId). */
export async function prunePendingPostsExceptUser(userId: number): Promise<void> {
  await hydrate();
  let changed = false;
  for (const [clientId, item] of Array.from(pending.entries())) {
    if (item.userId !== userId) {
      pending.delete(clientId);
      changed = true;
    }
  }
  if (changed) {
    await persist();
    emit();
  }
}

export async function clearAllPendingPosts(): Promise<void> {
  await hydrate();
  if (pending.size === 0) return;
  pending.clear();
  await AsyncStorage.removeItem(STORAGE_KEY);
  emit();
}

const POLL_DELAYS_MS = [1500, 2500, 4000, 6000, 10000, 15000, 25000, 40000, 60000];
const PROCESSING_404_GRACE_MS = 12 * 60 * 1000;

/** Older API builds 404 on processing posts (PublishedPostScope) — don't drop pending yet. */
function shouldDropMissingPost(postId: number): boolean {
  const item = Array.from(pending.values()).find((p) => p.postId === postId);
  if (!item) return true;
  if (item.status === 'processing' && Date.now() - item.createdAt < PROCESSING_404_GRACE_MS) {
    return false;
  }
  return true;
}

async function dropMissingPost(postId: number) {
  const match = Array.from(pending.values()).find((item) => item.postId === postId);
  if (match) await removePendingPost(match.clientId);
  removePostFromUserPostsInfiniteCache(queryClient, postId);
  clearCachedFeedVideo(postId);
}

async function applyPublishedPost(postId: number, post: Record<string, unknown>) {
  rememberPublishedPost(post);
  patchPostInUserPostsInfiniteCache(queryClient, postId, post);
  mergeRecentlyPublishedIntoFeedCache(queryClient);

  const match = Array.from(pending.values()).find((item) => item.postId === postId);
  if (match) await removePendingPost(match.clientId);
}

export async function pollUntilPublished(
  postId: number,
  userId: number,
  onPublished?: (postId: number) => void,
  onFailed?: (postId: number) => void,
): Promise<boolean> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return false;

  const currentUserId = await getCurrentUserId();
  if (currentUserId !== userId) return false;

  for (let i = 0; i < POLL_DELAYS_MS.length; i++) {
    await new Promise((r) => setTimeout(r, POLL_DELAYS_MS[i]));
    try {
      const post = await getPostById(postId, token);
      const status = post?.publish_status;
      if (status === 'published' && isPostMediaReady(post)) {
        await applyPublishedPost(postId, post);
        try {
          const { notifyPostPublished } = await import('@/utils/backgroundUpload');
          await notifyPostPublished();
        } catch {
          /* ignore notification failures */
        }
        onPublished?.(postId);
        return true;
      }
      if (status === 'processing') {
        continue;
      }
      if (status === 'failed') {
        await dropMissingPost(postId);
        onFailed?.(postId);
        return false;
      }
    } catch (error: any) {
      const status = error?.response?.status ?? error?.statusCode;
      if (status === 404 || status === 410) {
        if (!shouldDropMissingPost(postId)) continue;
        await dropMissingPost(postId);
        onFailed?.(postId);
        return false;
      }
    }
  }

  return false;
}

export async function reconcilePendingPosts(
  userId: number,
  onPublished?: (postId: number) => void,
  onFailed?: (postId: number) => void,
): Promise<void> {
  await hydrate();
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return;

  const currentUserId = await getCurrentUserId();
  if (currentUserId !== userId) {
    await prunePendingPostsExceptUser(currentUserId ?? userId);
    return;
  }

  await prunePendingPostsExceptUser(userId);

  const staleUploadMs = 20 * 60 * 1000;
  for (const item of Array.from(pending.values())) {
    if (item.userId !== userId) continue;
    if (item.status === 'uploading' && Date.now() - item.createdAt > staleUploadMs) {
      await markPendingFailed(item.clientId, 'Upload timed out. Please try again.');
      onFailed?.(item.postId ?? 0);
    }
  }

  const items = Array.from(pending.values()).filter(
    (item) => item.userId === userId && item.status === 'processing' && item.postId != null,
  );

  for (const item of items) {
    const postId = item.postId as number;
    try {
      const post = await getPostById(postId, token);
      const status = post?.publish_status;
      if (status === 'published' && isPostMediaReady(post)) {
        await applyPublishedPost(postId, post);
        onPublished?.(postId);
        continue;
      }
      if (status === 'processing') {
        continue;
      }
      if (status === 'failed') {
        await dropMissingPost(postId);
        onFailed?.(postId);
      }
    } catch (error: any) {
      const status = error?.response?.status ?? error?.statusCode;
      if (status === 404 || status === 410) {
        if (!shouldDropMissingPost(postId)) continue;
        await dropMissingPost(postId);
        onFailed?.(postId);
      }
    }
  }
}

export async function resumePendingPostPolling(
  userId: number,
  onPublished?: (postId: number) => void,
  onFailed?: (postId: number) => void,
): Promise<void> {
  const items = await getPendingPostsForUser(userId);
  items
    .filter((item) => item.status === 'processing' && item.postId != null)
    .forEach((item) => {
      pollUntilPublished(
        item.postId as number,
        userId,
        (postId) => onPublished?.(postId),
        (postId) => onFailed?.(postId),
      ).catch(() => {});
    });
}

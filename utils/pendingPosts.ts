import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getPostById } from '@/utils/queries/posts';
import { queryClient } from '@/utils/queryClient';

const STORAGE_KEY = 'gympaddy_pending_posts_v1';

export type PendingPost = {
  postId: number;
  createdAt: number;
  caption?: string;
  thumbnailUri?: string | null;
};

const pending = new Map<number, PendingPost>();
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  listeners.forEach((cb) => cb());
}

async function persist() {
  const items = Array.from(pending.values());
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const items: PendingPost[] = JSON.parse(raw);
    items.forEach((item) => pending.set(item.postId, item));
  } catch {
    /* noop */
  }
}

export function subscribePendingPosts(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function getPendingPosts(): Promise<PendingPost[]> {
  await hydrate();
  return Array.from(pending.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addPendingPost(entry: PendingPost): Promise<void> {
  await hydrate();
  pending.set(entry.postId, entry);
  await persist();
  emit();
}

export async function removePendingPost(postId: number): Promise<void> {
  await hydrate();
  if (!pending.delete(postId)) return;
  await persist();
  emit();
}

const POLL_DELAYS_MS = [3000, 8000, 15000, 30000, 60000];

export async function pollUntilPublished(
  postId: number,
  onPublished?: () => void,
  onFailed?: () => void,
): Promise<boolean> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return false;

  for (let i = 0; i < POLL_DELAYS_MS.length; i++) {
    await new Promise((r) => setTimeout(r, POLL_DELAYS_MS[i]));
    try {
      const post = await getPostById(postId, token);
      const status = post?.publish_status;
      if (status === 'published') {
        await removePendingPost(postId);
        await queryClient.invalidateQueries({ queryKey: ['userPosts'] });
        await queryClient.refetchQueries({ queryKey: ['userPosts'] });
        onPublished?.();
        return true;
      }
      if (status === 'failed') {
        await removePendingPost(postId);
        onFailed?.();
        return false;
      }
    } catch {
      /* retry */
    }
  }

  return false;
}

export async function resumePendingPostPolling(
  onPublished?: (postId: number) => void,
  onFailed?: (postId: number) => void,
): Promise<void> {
  const items = await getPendingPosts();
  items.forEach((item) => {
    pollUntilPublished(
      item.postId,
      () => onPublished?.(item.postId),
      () => onFailed?.(item.postId),
    ).catch(() => {});
  });
}

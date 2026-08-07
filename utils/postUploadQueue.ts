import { createPost } from '@/utils/mutations/posts';
import {
  markPendingFailed,
  pollUntilPublished,
  resolvePendingUpload,
  updatePendingPostProgress,
} from '@/utils/pendingPosts';
import {
  notifyUploadFailed,
  notifyUploadReceived,
  notifyPostPublished,
} from '@/utils/backgroundUpload';
import { rememberPublishedPost } from '@/utils/queries/posts';
import { prependPostToUserPostsInfiniteCache } from '@/utils/queries/posts';
import { queryClient } from '@/utils/queryClient';
import type { PostUploadFields, PostUploadFile } from '@/utils/postUpload';

const inflight = new Set<string>();

/**
 * Runs post upload outside any screen lifecycle so navigating home cannot cancel it.
 */
export function enqueuePostUpload(params: {
  clientId: string;
  userId: number;
  token: string;
  data: FormData;
  files: PostUploadFile[];
  fields?: PostUploadFields;
}): void {
  const { clientId, userId, token, data, files, fields } = params;
  if (inflight.has(clientId)) return;
  inflight.add(clientId);

  (async () => {
    try {
      const response = await createPost({
        data,
        token,
        files,
        fields,
        onProgress: ({ percent }) => updatePendingPostProgress(clientId, percent),
      });

      const isAsync = Boolean(response?.async);
      const postId = Number(response?.post?.id);

      if (isAsync && Number.isFinite(postId)) {
        await resolvePendingUpload(clientId, postId);
        await notifyUploadReceived('post');
        pollUntilPublished(postId, userId).catch(() => {});
        return;
      }

      const { removePendingPost } = await import('@/utils/pendingPosts');
      await removePendingPost(clientId);
      await notifyUploadReceived('post');
      await notifyPostPublished();
      if (response?.post) {
        rememberPublishedPost(response.post);
        prependPostToUserPostsInfiniteCache(queryClient, response.post);
      }
    } catch (error: any) {
      const message =
        error?.message || 'Upload failed. Check your connection and try again.';
      console.warn('❌ Background post upload failed:', message);
      await markPendingFailed(clientId, message);
      await notifyUploadFailed('post', message);
    } finally {
      inflight.delete(clientId);
    }
  })();
}

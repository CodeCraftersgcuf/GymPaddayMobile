import React, { useCallback, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useQuery, useMutation } from '@tanstack/react-query';
import CommentsBottomSheet from './CommentsBottomSheet';
import { getPostComments } from '@/utils/queries/comments';
import { createComment } from '@/utils/mutations/comments';
import { resolveMediaUrl } from '@/utils/mediaUrl';

type InternalComment = {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  text: string;
  timestamp: string;
  likes: number;
  replies: InternalComment[];
  parentId?: string | null;
};

function mapApiCommentsToInternal(apiComments: any[]): InternalComment[] {
  return (apiComments || []).map((item) => ({
    id: item.id.toString(),
    userId: item.user?.id?.toString() || '',
    username: item.user?.username || 'Unknown',
    profileImage: resolveMediaUrl(item.user?.profile_picture_url) || '',
    text: item.content || '',
    timestamp: item.created_at,
    likes: 0,
    replies: mapApiCommentsToInternal(item.replies || []),
  }));
}

type PostCommentsSheetProps = {
  visible: boolean;
  postId: number | null;
  onClose: () => void;
  /** Called after a comment is successfully queued so the caller can bump its count. */
  onCommentAdded?: (postId: number) => void;
};

/**
 * Self-contained comments bottom sheet: owns its own query + mutation for a
 * given postId. Safe to render inside a Modal (e.g. the Reels viewer) so it
 * appears above the video instead of behind it like the feed-level sheet.
 */
export default function PostCommentsSheet({
  visible,
  postId,
  onClose,
  onCommentAdded,
}: PostCommentsSheetProps) {
  const [optimisticComments, setOptimisticComments] = useState<InternalComment[]>([]);

  const {
    data: commentData,
    isLoading,
  } = useQuery({
    queryKey: ['postComments', postId],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token || !postId) throw new Error('No token or postId');
      return getPostComments(token, postId);
    },
    enabled: !!postId && visible,
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });

  const { mutate: addCommentMutation } = useMutation({
    mutationFn: async ({ text, postId: pid }: { text: string; postId: number; tempId: string }) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No token');
      return createComment({ data: { post_id: pid, content: text }, token });
    },
    onError: (_error, variables) => {
      setOptimisticComments((prev) => prev.filter((c) => c.id !== variables.tempId));
    },
  });

  const handleAddComment = useCallback(
    async (text: string, pid: number) => {
      let user: any = null;
      try {
        const userData = await SecureStore.getItemAsync('user_data');
        user = userData ? JSON.parse(userData) : null;
      } catch {
        user = null;
      }

      const tempId = `temp_${Date.now()}`;
      const tempComment: InternalComment = {
        id: tempId,
        userId: user?.id?.toString() || 'current_user',
        username: user?.username || 'You',
        profileImage: resolveMediaUrl(user?.profile_picture_url) || '',
        text,
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: [],
        parentId: null,
      };

      setOptimisticComments((prev) => [...prev, tempComment]);
      addCommentMutation({ text, postId: pid, tempId });
      onCommentAdded?.(pid);
    },
    [addCommentMutation, onCommentAdded],
  );

  const handleClose = useCallback(() => {
    setOptimisticComments([]);
    onClose();
  }, [onClose]);

  const comments = useMemo(
    () => [...mapApiCommentsToInternal(commentData || []), ...optimisticComments],
    [commentData, optimisticComments],
  );

  if (!visible) return null;

  return (
    <CommentsBottomSheet
      visible={visible}
      comments={comments}
      postId={postId}
      onClose={handleClose}
      onAddComment={handleAddComment}
      loading={isLoading && !commentData}
    />
  );
}

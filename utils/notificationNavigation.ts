import type { Router } from 'expo-router';
import { openSinglePost } from '@/utils/prefetchNavigation';

export type AppNotification = {
  id: string;
  title: string;
  description?: string;
  body?: string;
  type?: string;
  data?: Record<string, unknown> | null;
  is_read?: boolean;
  isRead?: boolean;
  created_at?: string;
};

const NON_INTERACTIVE_TYPES = new Set([
  'login',
  'register',
  'general',
]);

export function isInteractiveNotification(notification: AppNotification): boolean {
  const type = normalizeType(notification.type);
  if (!type || NON_INTERACTIVE_TYPES.has(type)) {
    return false;
  }
  return getNotificationRoute(notification) !== null;
}

function normalizeType(type?: string): string {
  return String(type || '').trim().toLowerCase();
}

function readData(notification: AppNotification): Record<string, unknown> {
  const raw = notification.data;
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  }
  return raw;
}

function readId(data: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return null;
}

export function getNotificationRoute(notification: AppNotification): {
  pathname: string;
  params?: Record<string, string>;
} | null {
  const type = normalizeType(notification.type);
  const data = readData(notification);

  switch (type) {
    case 'like':
    case 'comment':
    case 'reply':
    case 'share':
    case 'post_published':
    case 'post_failed': {
      const postId = readId(data, 'post_id', 'postId');
      return postId ? { pathname: '/SinglePostScreen', params: { postId } } : null;
    }
    case 'follow': {
      const userId = readId(data, 'follower_id', 'user_id', 'from_user_id');
      return userId ? { pathname: '/UserProfile', params: { user_id: userId } } : null;
    }
    case 'message': {
      const conversationId = readId(data, 'conversation_id', 'conversationId');
      const userId = readId(data, 'sender_id', 'user_id');
      if (!conversationId && !userId) return null;
      return {
        pathname: '/messageChat',
        params: {
          ...(conversationId ? { conversation_id: conversationId } : {}),
          ...(userId ? { user_id: userId } : {}),
        },
      };
    }
    case 'gift': {
      const userId = readId(data, 'from_user_id', 'sender_id');
      return userId ? { pathname: '/UserProfile', params: { user_id: userId } } : null;
    }
    case 'ticket_reply':
    case 'support':
      return { pathname: '/support' };
    case 'wallet_topup':
    case 'wallet_withdraw':
    case 'withdraw':
      return { pathname: '/transactionHistory' };
    case 'story_published':
    case 'story_failed':
      return { pathname: '/(tabs)' };
    case 'incoming_call': {
      const callId = readId(data, 'call_id', 'callId');
      if (!callId) return null;
      return {
        pathname: '/StreamIncomingCall',
        params: {
          call_id: callId,
          call_type: String(data.call_type || 'voice'),
          caller_name: String(data.caller_name || 'Unknown'),
          caller_avatar: String(data.caller_avatar || ''),
          receiver_id: String(data.caller_id || data.receiver_id || ''),
        },
      };
    }
    default:
      return null;
  }
}

export function navigateFromNotification(
  router: Router,
  notification: AppNotification,
): boolean {
  if (!isInteractiveNotification(notification)) {
    return false;
  }

  const type = normalizeType(notification.type);
  const data = readData(notification);
  const postId = readId(data, 'post_id', 'postId');

  if (postId && ['like', 'comment', 'reply', 'share', 'post_published'].includes(type)) {
    openSinglePost(router, Number(postId));
    return true;
  }

  const route = getNotificationRoute(notification);
  if (!route) return false;

  // Ringtone is owned by StreamIncomingCall — do not start it here.
  router.push({
    pathname: route.pathname as any,
    params: route.params,
  });
  return true;
}

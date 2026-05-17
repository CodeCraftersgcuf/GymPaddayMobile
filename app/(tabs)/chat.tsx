import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/themeContext';
import { useMessages } from '@/components/messages/MessageContext';

import Header from '@/components/messages/header';
import SearchBar from '@/components/messages/SearchBar';
import AvatarList from '@/components/messages/AvatarList';
import ConversationList from '@/components/messages/ConversationList';
import SocialsModal from '@/components/messages/SocialsModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedView from '@/components/ThemedView';

// Integration
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchConnectedUsers } from '@/utils/queries/chat';
import * as SecureStore from 'expo-secure-store';

function pickString(v: unknown): string {
  return typeof v === 'string' && v.trim() ? v.trim() : '';
}

const SKIP_DEEP_STRING_KEYS = new Set([
  'id',
  'sender_id',
  'receiver_id',
  'conversation_id',
  'user_id',
  'created_at',
  'updated_at',
  'deleted_at',
  'profile_picture_url',
  'profile_picture',
  'email',
  'username',
  'fullname',
  'name',
  'first_name',
  'last_name',
  'phone',
  'token',
  'direction',
  'status',
  'mime_type',
  'image_url',
  'media_url',
  'url',
  'uuid',
]);

/** Don’t treat nested user blobs as the message preview. */
const SKIP_DEEP_SUBTREE_KEYS = new Set([
  'sender',
  'receiver',
  'user',
  'other_user',
  'from',
  'to',
]);

/** Pull human-readable text from nested API objects (avoids missing previews when shape varies). */
function stringifyMessageContent(v: unknown, depth = 0): string {
  if (v == null || depth > 5) return '';
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return '';
    try {
      const parsed = JSON.parse(t);
      if (parsed && typeof parsed === 'object') {
        const inner = stringifyMessageContent(parsed, depth + 1);
        if (inner) return inner;
      }
    } catch {
      /* not JSON */
    }
    return t;
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v !== 'object') return '';
  const o = v as Record<string, unknown>;
  const keys = [
    'message',
    'text',
    'body',
    'content',
    'caption',
    'preview',
    'snippet',
    'label',
    'title',
    'chat_message',
    'message_text',
    'plain_text',
    'description',
    'note',
    'msg',
  ];
  for (const k of keys) {
    const s = stringifyMessageContent(o[k], depth + 1);
    if (s) return s;
  }
  return '';
}

/** First non-empty string under `obj`, skipping obvious non-message fields. */
function deepFirstMessageString(obj: unknown, depth = 0): string {
  if (obj == null || depth > 8) return '';
  if (typeof obj === 'string') {
    const t = obj.trim();
    if (t.length < 1) return '';
    if (/^https?:\/\//i.test(t)) return '';
    if (/^\d{4}-\d{2}-\d{2}T/.test(t)) return '';
    return t;
  }
  if (typeof obj !== 'object') return '';
  const record = obj as Record<string, unknown>;
  for (const [k, v] of Object.entries(record)) {
    if (SKIP_DEEP_STRING_KEYS.has(k) || SKIP_DEEP_SUBTREE_KEYS.has(k)) continue;
    const s = deepFirstMessageString(v, depth + 1);
    if (s) return s;
  }
  return '';
}

/** Resolve the payload object that represents the latest chat line (API shapes differ). */
function getLastMessageRecord(conv: any): any {
  const direct = [
    conv?.last_message,
    conv?.latest_message,
    conv?.lastMessage,
    conv?.recent_message,
    conv?.last_chat_message,
    conv?.lastChatMessage,
    conv?.data?.last_message,
    conv?.data?.latest_message,
  ];
  for (const d of direct) {
    if (d == null) continue;
    if (typeof d === 'string' && d.trim()) return { message: d };
    if (typeof d === 'object' && !Array.isArray(d) && Object.keys(d).length > 0) {
      return d;
    }
  }

  const lists = [
    conv?.messages,
    conv?.chat_messages,
    conv?.recent_messages,
    conv?.data?.messages,
  ];
  for (const list of lists) {
    if (!Array.isArray(list) || list.length === 0) continue;
    const sorted = [...list].sort((a, b) => {
      const ta = new Date(a?.created_at || a?.updated_at || 0).getTime();
      const tb = new Date(b?.created_at || b?.updated_at || 0).getTime();
      return tb - ta;
    });
    if (sorted[0]) return sorted[0];
  }
  return null;
}

/** Normalize API conversation row to a single preview line. */
function getConversationLastMessagePreview(conv: any): string {
  const rootPreview =
    pickString(conv?.last_message_preview) ||
    pickString(conv?.last_message_text) ||
    pickString(conv?.preview) ||
    pickString(conv?.snippet);
  if (rootPreview) return rootPreview;

  const last = getLastMessageRecord(conv);

  if (!last) {
    return String(conv?.type ?? '').toLowerCase() === 'marketplace'
      ? 'Marketplace conversation'
      : '';
  }

  let text = stringifyMessageContent(last);
  if (text) return text;

  text =
    pickString(last.message) ||
    pickString(last.body) ||
    pickString(last.content) ||
    pickString(last.text) ||
    pickString(last.chat_message) ||
    pickString(last.message_text);
  if (text) return text;

  if (last.message != null && typeof last.message === 'object') {
    const m = last.message as Record<string, unknown>;
    text =
      pickString(m.text as string) ||
      pickString(m.body as string) ||
      pickString(m.content as string) ||
      stringifyMessageContent(m.message, 0);
    if (text) return text;
  }

  text = deepFirstMessageString(last);
  if (text) return text;

  const listing =
    last.listing ??
    last.product ??
    last.metadata?.listing ??
    last.attachments?.[0]?.listing;
  if (listing && typeof listing === 'object' && listing !== null && 'title' in listing) {
    const title = (listing as { title?: string }).title;
    if (title) return `📦 ${title}`;
  }
  if (
    (Array.isArray(last.attachments) && last.attachments.length > 0) ||
    last.has_attachment ||
    pickString(last.image_url) ||
    pickString(last.media_url)
  ) {
    return '📷 Media message';
  }
  const mt = String(last.message_type || last.type || '').toLowerCase();
  if (mt.includes('image') || mt.includes('photo')) return '📷 Photo';
  if (String(conv?.type ?? '').toLowerCase() === 'marketplace') {
    return 'New marketplace message';
  }
  return '';
}

function extractConversationRows(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data.conversations)) return data.conversations;
  if (Array.isArray(data.data?.conversations)) return data.data.conversations;
  if (
    Array.isArray(data.data) &&
    data.data.length > 0 &&
    (data.data[0]?.other_user != null || data.data[0]?.conversation_id != null)
  ) {
    return data.data;
  }
  return [];
}

export default function Chat() {


  const router = useRouter();
  const queryClient = useQueryClient();
  const { dark } = useTheme();
  const { users } = useMessages();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const getToken = async () => {
    return await SecureStore.getItemAsync('auth_token');
  };

  // Query for conversations
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token found');
      return fetchConnectedUsers(token);
    },
  });
  const conversationRows = extractConversationRows(data);

  // Transform API data to ConversationList format
  const apiConversations =
    conversationRows.map((conv: any, index: number) => {
      const last = getLastMessageRecord(conv);
      const cid = conv.conversation_id ?? conv.id;
      return {
        id: cid != null ? String(cid) : `conv-fallback-${index}`,
        user: {
          id: String(conv.other_user?.id ?? ''),
          username: conv.other_user?.username ?? 'User',
          profile_img: conv.other_user?.profile_picture_url,
          online: !!conv.other_user?.is_online,
        },
        lastMessage: {
          text: getConversationLastMessagePreview(conv),
          timestamp: last?.created_at
            ? new Date(last.created_at)
            : new Date(conv.updated_at || conv.created_at || Date.now()),
          unreadCount:
            last?.unread_count ?? conv.unread_count ?? conv.unread_messages ?? 0,
        },
        other_user: conv.other_user,
        conversation_id: cid,
        type: conv.type,
      };
    }) || [];


  // Build users for AvatarList from API conversations
  const apiUsers =
    apiConversations.length > 0
      ? Array.from(
        new Map(
          apiConversations.map((conv) => [
            conv.user.id,
            {
              id: conv.user.id,
              username: conv.user.username,
              profile_img: conv.user.profile_img,
              online: !!conv.user?.online,
            },
          ])
        ).values()
      )
      : [];

  // Filtering by username or last message
  const filteredConversations = apiConversations
    .filter((conv) =>
      conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((conv) => {
      if (!selectedType) return true;
      const t = String(conv.type ?? '').toLowerCase();
      return t === String(selectedType).toLowerCase();
    });

  const headerFilter =
    selectedType === 'marketplace' || selectedType === 'social'
      ? selectedType
      : 'all';

  // AvatarList: use users from context (not API)
  const handleAvatarPress = (userId: string) => {
    // Find conversation with this user
    const found = apiConversations.find(
      (conv) => conv.user.id === userId
    );
    if (found) {
      router.push({
        pathname: '/messageChat',
        params: {
          conversation_id: found.conversation_id,
          user_id: found.user.id,
        },
      });
    }
  };

  // Conversation press: pass conversation_id and other_user id.
  // Also optimistically clear the unreadCount for this conversation in the local cache
  // so the badge resets immediately when user opens the chat.
  const handleConversationPress = (conversationId: string) => {
    const found = apiConversations.find(
      (conv) => conv.id === conversationId
    );
    if (found) {
      // Optimistically zero-out unread count in conversations query cache
      queryClient.setQueryData<any>(['conversations'], (old) => {
        if (!old || !Array.isArray(old.conversations)) return old;
        return {
          ...old,
          conversations: old.conversations.map((conv: any) =>
            conv.conversation_id === found.conversation_id
              ? {
                  ...conv,
                  last_message: {
                    ...(conv.last_message || {}),
                    unread_count: 0,
                  },
                }
              : conv
          ),
        };
      });

      router.push({
        pathname: '/messageChat',
        params: {
          conversation_id: found.conversation_id,
          user_id: found.user.id,
        },
      });
    }
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const socialOptions = ['all', 'marketplace', 'social'];

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content} darkColor={dark ? '#000' : '#FAFAFA'}>
        <Header
          onBack={() => router.back()}
          onOpenSocials={() => setShowSocialModal(true)}
          selectedFilter={headerFilter}
        />
        <SearchBar query={searchQuery} onChange={setSearchQuery} />
        {/* Show loading indicator while users are loading */}
        {isLoading ? (
          <View style={{ paddingVertical: 24 }}>
            <ActivityIndicator size="large" color={dark ? 'white' : 'black'} />
          </View>
        ) : (
          <AvatarList users={apiUsers} onAvatarPress={handleAvatarPress} />
        )}

        <ThemedView style={styles.conversationsWrapper} darkColor={dark ? '#202020' : 'white'}>
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={dark ? 'white' : 'black'} />
            </View>
          ) : (
            <ConversationList
              conversations={filteredConversations}
              onConversationPress={handleConversationPress}
              refreshing={refreshing || isRefetching}
              onRefresh={onRefresh}
            />
          )}
        </ThemedView>
      </ThemedView>

      <SocialsModal
        visible={showSocialModal}
        onClose={() => setShowSocialModal(false)}
        options={socialOptions}
        onSelect={(type) => {
          setSelectedType(type === 'all' ? null : type); // clear filter if all
          setShowSocialModal(false);
        }}

      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'tranxsparent',
  },
  content: {
    flex: 1,
  },
  conversationsWrapper: {
    flex: 1,
    marginTop: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  }
});
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { LIVE_STREAM_API_BASE } from '@/utils/liveStreamConstants';

const EMPTY_CHATS: any[] = [];

export const useLiveStreamChats = (liveStreamId: string) => {
  return useQuery({
    queryKey: ['liveStreamChats', liveStreamId],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');
      const response = await fetch(`${LIVE_STREAM_API_BASE}/live-streams/${liveStreamId}/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const res = await response.json();
      if (!response.ok) throw new Error(res.message || 'Failed to fetch chats');

      return Array.isArray(res.data) ? res.data : EMPTY_CHATS;
    },
    enabled: !!liveStreamId,
    refetchInterval: liveStreamId ? 3000 : false,
    placeholderData: EMPTY_CHATS,
  });
};

/** Stable empty list — never use `data = []` in destructuring (new array each render → max update depth). */
export function useLiveStreamChatList(liveStreamId: string) {
  const query = useLiveStreamChats(liveStreamId);
  return {
    ...query,
    chats: query.data ?? EMPTY_CHATS,
  };
}

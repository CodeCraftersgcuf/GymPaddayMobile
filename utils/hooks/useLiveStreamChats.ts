// hooks/useLiveStreamChats.ts
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

export const useLiveStreamChats = (liveStreamId: string) => {
  console.log("live stream id",liveStreamId)
  return useQuery({
    queryKey: ['liveStreamChats', liveStreamId],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetch(`https://gympaddry.hmstech.xyz/api/user/live-streams/${liveStreamId}/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const res = await response.json();
      console.log("response is ",res)
      if (!response.ok) throw new Error(res.message || 'Failed to fetch chats');

      return res.data; // Laravel returns { status: true, data: [...] }
    },
    enabled: !!liveStreamId,
    refetchInterval: 1000, // Optional: poll every 3 seconds
  });
};

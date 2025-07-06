// hooks/useSendLiveStreamMessage.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

export const useSendLiveStreamMessage = (liveStreamId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetch(`https://gympaddy.hmstech.xyz/api/user/live-streams/${liveStreamId}/chats`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const res = await response.json();
      console.log("response fo sending",res)
      if (!response.ok) throw new Error(res.message || 'Failed to send message');

      return res.data; // Laravel returns { status: true, message: ..., data: {...} }
      
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['liveStreamChats', liveStreamId]);
    },
  });
};

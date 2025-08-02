import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

interface SendLiveStreamMessagePayload {
  message: string;
  type?: string; // "message", "gift", etc.
  amount?: string;
  reply_to?: string; // optional reply-to message ID
}

export const useSendLiveStreamMessage = (liveStreamId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ message, type = 'message', amount = '10', reply_to }: SendLiveStreamMessagePayload) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');

      const payload: Record<string, any> = { message, type, amount };
      if (reply_to) {
        payload.reply_to_id = reply_to;
      }

      const response = await fetch(
        `https://gympaddy.hmstech.xyz/api/user/live-streams/${liveStreamId}/chats`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const res = await response.json();
      console.log('response for sending:', res);

      if (!response.ok) throw new Error(res.message || 'Failed to send message');

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['liveStreamChats', liveStreamId]);
    },
  });
};

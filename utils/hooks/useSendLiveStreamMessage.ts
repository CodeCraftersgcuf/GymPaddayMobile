import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { LIVE_STREAM_API_BASE } from '@/utils/liveStreamConstants';

interface SendLiveStreamMessagePayload {
  message: string;
  type?: string; // "message", "gift", etc.
  /** Required when type === 'gift' — GP coin total to transfer */
  amount?: string;
  reply_to?: string; // optional reply-to message ID
}

export const useSendLiveStreamMessage = (liveStreamId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ message, type = 'message', amount, reply_to }: SendLiveStreamMessagePayload) => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');

      const payload: Record<string, any> = { message, type };
      if (type === 'gift') {
        if (amount == null || amount === '') {
          throw new Error('Gift amount is required');
        }
        payload.amount = amount;
      }
      if (reply_to) {
        payload.reply_to_id = reply_to;
      }

      const response = await fetch(
        `${LIVE_STREAM_API_BASE}/live-streams/${liveStreamId}/chats`,
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

      if (!response.ok) {
        const msg =
          (typeof res.message === 'string' && res.message) ||
          (res.message && String(res.message)) ||
          (response.status === 410 ? 'This live stream has ended.' : 'Failed to send message');
        const err = new Error(msg) as Error & { status?: number };
        err.status = response.status;
        throw err;
      }

      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['liveStreamChats', liveStreamId] });
      if (variables.type === 'gift') {
        queryClient.invalidateQueries({ queryKey: ['user-gifts'] });
      }
    },
  });
};

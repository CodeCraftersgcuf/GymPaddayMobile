// hooks/useLiveStreams.ts
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

export const useLiveStreams = () => {
  return useQuery({
    queryKey: ['liveStreams'],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetch('https://gympaddy.hmstech.xyz/api/user/live-streams', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch live streams');

      const data = await response.json();
      return data;
    },
  });
};

// hooks/useLiveStreams.ts
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

export const useLiveStreams = () => {
  return useQuery({
    queryKey: ['liveStreams'],
    refetchInterval: 15_000,
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetch('https://gympaddy.skillverse.com.pk/api/user/live-streams', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch live streams');

      const json = await response.json();
      // Laravel index() returns a raw array; some gateways may wrap as { data: [...] }.
      const streams = Array.isArray(json) ? json : json?.data ?? [];
      return streams;
    },
  });
};

import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '@/utils/queryClient';
import { flushQueryCache, queryPersistOptions } from '@/utils/queryPersistence';

interface Props {
  children: React.ReactNode;
  onHydrated?: () => void;
}

export default function AppQueryProvider({ children, onHydrated }: Props) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        flushQueryCache().catch(() => {});
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={queryPersistOptions}
      onSuccess={() => {
        onHydrated?.();
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

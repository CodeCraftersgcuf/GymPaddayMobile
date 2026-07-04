import React from 'react';
import { FeedSessionProvider, useFeedSession } from '@/contexts/FeedSessionContext';
import { FeedVideoProvider } from '@/contexts/FeedVideoContext';
import NavigationPersistence from '@/components/NavigationPersistence';

function SessionPersistenceBridge() {
  const { getFeedScrollOffset, getActivePostId } = useFeedSession();
  return (
    <NavigationPersistence
      getFeedScrollOffset={getFeedScrollOffset}
      getActivePostId={getActivePostId}
    />
  );
}

export function AppSessionProviders({ children }: { children: React.ReactNode }) {
  return (
    <FeedSessionProvider>
      <FeedVideoProvider>
        <SessionPersistenceBridge />
        {children}
      </FeedVideoProvider>
    </FeedSessionProvider>
  );
}

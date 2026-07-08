import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

type FeedSessionContextValue = {
  registerFeedScroll: (getOffset: () => number) => void;
  registerActivePostId: (getId: () => number | null) => void;
  getFeedScrollOffset: () => number;
  getActivePostId: () => number | null;
};

const FeedSessionContext = createContext<FeedSessionContextValue | null>(null);

export function FeedSessionProvider({ children }: { children: React.ReactNode }) {
  const scrollGetter = useRef<() => number>(() => 0);
  const activePostGetter = useRef<() => number | null>(() => null);

  const registerFeedScroll = useCallback((getOffset: () => number) => {
    scrollGetter.current = getOffset;
  }, []);

  const registerActivePostId = useCallback((getId: () => number | null) => {
    activePostGetter.current = getId;
  }, []);

  const getFeedScrollOffset = useCallback(() => scrollGetter.current(), []);
  const getActivePostId = useCallback(() => activePostGetter.current(), []);

  const value = useMemo(
    () => ({
      registerFeedScroll,
      registerActivePostId,
      getFeedScrollOffset,
      getActivePostId,
    }),
    [registerFeedScroll, registerActivePostId, getFeedScrollOffset, getActivePostId]
  );

  return (
    <FeedSessionContext.Provider value={value}>
      {children}
    </FeedSessionContext.Provider>
  );
}

export function useFeedSession() {
  const ctx = useContext(FeedSessionContext);
  if (!ctx) {
    throw new Error('useFeedSession must be used within FeedSessionProvider');
  }
  return ctx;
}

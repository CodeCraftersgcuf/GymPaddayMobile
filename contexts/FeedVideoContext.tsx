import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'feed_video_muted';

type FeedVideoContextValue = {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
};

const FeedVideoContext = createContext<FeedVideoContextValue | null>(null);

export function FeedVideoProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw === '0') setIsMuted(false);
        else if (raw === '1') setIsMuted(true);
      } catch {
        /* keep default */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((muted: boolean) => {
    AsyncStorage.setItem(STORAGE_KEY, muted ? '1' : '0').catch(() => {});
  }, []);

  const setMuted = useCallback(
    (muted: boolean) => {
      setIsMuted(muted);
      if (hydrated) persist(muted);
    },
    [hydrated, persist]
  );

  const toggleMuted = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (hydrated) persist(next);
      return next;
    });
  }, [hydrated, persist]);

  const value = useMemo(
    () => ({ isMuted, setMuted, toggleMuted }),
    [isMuted, setMuted, toggleMuted]
  );

  return (
    <FeedVideoContext.Provider value={value}>{children}</FeedVideoContext.Provider>
  );
}

export function useFeedVideo(): FeedVideoContextValue {
  const ctx = useContext(FeedVideoContext);
  if (!ctx) {
    throw new Error('useFeedVideo must be used within FeedVideoProvider');
  }
  return ctx;
}

/** Use in PostItem when it may render outside FeedVideoProvider (e.g. tests). */
export function useFeedVideoOptional(): FeedVideoContextValue | null {
  return useContext(FeedVideoContext);
}

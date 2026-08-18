import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Audio } from 'expo-av';

type FeedVideoContextValue = {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
};

const FeedVideoContext = createContext<FeedVideoContextValue | null>(null);

export function FeedVideoProvider({ children }: { children: React.ReactNode }) {
  // Videos always start muted; user must tap the mute icon to hear audio.
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
  }, []);

  const toggleMuted = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

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

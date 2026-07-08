import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getLastRoute, type SavedRoute } from '@/utils/sessionPersistence';
import { initAppLifecycle, isColdStart, markBootCompleted, onWarmResume } from '@/utils/appLifecycle';
import { softRefreshAppData } from '@/utils/preloadAppData';
import { initNetworkQuality } from '@/utils/networkQuality';

export type BootPhase = 'idle' | 'prefetching' | 'ready';

export type BootState = {
  phase: BootPhase;
  isColdStart: boolean;
  hasToken: boolean;
  hasSeenOnboarding: boolean;
  savedRoute: SavedRoute | null;
};

const defaultState: BootState = {
  phase: 'idle',
  isColdStart: true,
  hasToken: false,
  hasSeenOnboarding: false,
  savedRoute: null,
};

const AppBootContext = createContext<BootState>(defaultState);

export function useAppBoot() {
  return useContext(AppBootContext);
}

type Props = {
  children: React.ReactNode;
  cacheHydrated: boolean;
};

export function AppBootProvider({ children, cacheHydrated }: Props) {
  const [boot, setBoot] = useState<BootState>(defaultState);

  useEffect(() => {
    const teardownNetwork = initNetworkQuality();
    const teardown = initAppLifecycle();
    const unsubResume = onWarmResume(() => {
      softRefreshAppData().catch(() => {});
    });
    return () => {
      teardownNetwork();
      teardown();
      unsubResume();
    };
  }, []);

  useEffect(() => {
    if (!cacheHydrated) return;

    let cancelled = false;

    (async () => {
      const cold = isColdStart();
      setBoot((prev) => ({ ...prev, phase: 'prefetching', isColdStart: cold }));

      try {
        const [hasSeenOnboarding, token, savedRoute] = await Promise.all([
          AsyncStorage.getItem('hasSeenOnboarding'),
          SecureStore.getItemAsync('auth_token'),
          getLastRoute(),
        ]);

        if (cancelled) return;

        const hasToken = Boolean(token);

        markBootCompleted();
        setBoot({
          phase: 'ready',
          isColdStart: cold,
          hasToken,
          hasSeenOnboarding: Boolean(hasSeenOnboarding),
          savedRoute,
        });

        if (cold && hasToken) {
          const { preloadAppData } = await import('@/utils/preloadAppData');
          preloadAppData(token, { timeoutMs: 3000, persistAfter: true }).catch(() => {});
        }
      } catch {
        if (!cancelled) {
          markBootCompleted();
          setBoot((prev) => ({
            ...prev,
            phase: 'ready',
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cacheHydrated]);

  return <AppBootContext.Provider value={boot}>{children}</AppBootContext.Provider>;
}

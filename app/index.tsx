import React from 'react';
import { Redirect } from 'expo-router';
import { useAppBoot } from '@/contexts/AppBootContext';
import { normalizeRestorableRoute } from '@/utils/safeNavigation';
import Login from './login';

/**
 * Entry redirect — boot splash already loaded data; no extra spinner here.
 */
export default function Index() {
  const boot = useAppBoot();

  if (boot.phase !== 'ready') {
    return null;
  }

  if (!boot.hasSeenOnboarding) {
    return <Redirect href="/OnboardingScreen" />;
  }

  if (!boot.hasToken) {
    return <Login />;
  }

  const restorePath = normalizeRestorableRoute(boot.savedRoute?.pathname ?? '/(tabs)');
  const restoreParams = boot.savedRoute?.params;

  if (restoreParams && restorePath.startsWith('/(tabs)')) {
    return (
      <Redirect
        href={{ pathname: restorePath as any, params: restoreParams }}
      />
    );
  }

  return <Redirect href={restorePath as any} />;
}

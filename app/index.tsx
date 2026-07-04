import React from 'react';
import { Redirect } from 'expo-router';
import { useAppBoot } from '@/contexts/AppBootContext';
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

  if (boot.savedRoute?.params) {
    return (
      <Redirect
        href={{ pathname: boot.savedRoute.pathname as any, params: boot.savedRoute.params }}
      />
    );
  }

  return <Redirect href={(boot.savedRoute?.pathname ?? '/(tabs)') as any} />;
}

import type { Router } from 'expo-router';

/** Routes that must not be restored as the sole cold-start screen (no back stack). */
export const AUTH_ROUTES = new Set(['/', '/login', '/OnboardingScreen', '/register']);

export function isTabRoute(pathname: string): boolean {
  return pathname === '/(tabs)' || pathname.startsWith('/(tabs)/');
}

export function normalizeRestorableRoute(pathname: string): string {
  if (!pathname || AUTH_ROUTES.has(pathname)) {
    return '/(tabs)';
  }
  if (isTabRoute(pathname)) {
    return pathname;
  }
  return '/(tabs)';
}

/** Go back when possible; otherwise land on the main feed tabs. */
export function safeGoBack(router: Router): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(tabs)');
}

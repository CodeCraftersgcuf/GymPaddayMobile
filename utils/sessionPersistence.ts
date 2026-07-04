import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Router } from 'expo-router';

const LAST_ROUTE_KEY = 'gympaddy:last_route';
const FEED_SCROLL_KEY = 'gympaddy:feed_scroll_offset';
const FEED_ACTIVE_POST_KEY = 'gympaddy:feed_active_post';

const AUTH_ROUTES = new Set(['/', '/login', '/OnboardingScreen', '/register']);

export type SavedRoute = {
  pathname: string;
  params?: Record<string, string>;
};

function normalizeParams(
  params?: Record<string, string | string[] | undefined>
): Record<string, string> | undefined {
  if (!params) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    out[key] = Array.isArray(value) ? value[0] : value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export async function saveLastRoute(
  pathname: string,
  params?: Record<string, string | string[] | undefined>
): Promise<void> {
  if (!pathname || AUTH_ROUTES.has(pathname)) return;

  const payload: SavedRoute = {
    pathname,
    params: normalizeParams(params),
  };

  await AsyncStorage.setItem(LAST_ROUTE_KEY, JSON.stringify(payload));
}

export async function getLastRoute(): Promise<SavedRoute | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_ROUTE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedRoute;
    if (!parsed?.pathname || AUTH_ROUTES.has(parsed.pathname)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function restoreLastRoute(router: Router): Promise<boolean> {
  const saved = await getLastRoute();
  if (!saved?.pathname) return false;

  try {
    if (saved.params) {
      router.replace({ pathname: saved.pathname as any, params: saved.params });
    } else {
      router.replace(saved.pathname as any);
    }
    return true;
  } catch {
    return false;
  }
}

export async function saveFeedScrollState(offset: number, activePostId?: number | null) {
  await AsyncStorage.setItem(FEED_SCROLL_KEY, String(Math.max(0, offset)));
  if (activePostId != null) {
    await AsyncStorage.setItem(FEED_ACTIVE_POST_KEY, String(activePostId));
  }
}

export async function getFeedScrollState(): Promise<{ offset: number; activePostId: number | null }> {
  try {
    const [offsetRaw, postRaw] = await Promise.all([
      AsyncStorage.getItem(FEED_SCROLL_KEY),
      AsyncStorage.getItem(FEED_ACTIVE_POST_KEY),
    ]);
    return {
      offset: offsetRaw ? parseFloat(offsetRaw) : 0,
      activePostId: postRaw ? parseInt(postRaw, 10) : null,
    };
  } catch {
    return { offset: 0, activePostId: null };
  }
}

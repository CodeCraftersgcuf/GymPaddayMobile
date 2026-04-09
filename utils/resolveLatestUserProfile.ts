import * as SecureStore from 'expo-secure-store';
import { apiCall } from '@/utils/customApiCall';
import { API_ENDPOINTS } from '@/apiConfig';

/** Match profile / API shapes (same fields as EditProfile: fullname, username, etc.). */
export function extractDepositorDisplayName(user: Record<string, unknown> | null | undefined): string {
  if (!user || typeof user !== 'object') return '';
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const fullname = s(user.fullname);
  if (fullname) return fullname;
  const fullName = s(user.fullName);
  if (fullName) return fullName;
  const name = s(user.name);
  if (name) return name;
  const first = s(user.first_name);
  const last = s(user.last_name);
  const combined = [first, last].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  const username = s(user.username);
  if (username) return username;
  return '';
}

async function readUserFromSecureStore(): Promise<Record<string, unknown> | null> {
  try {
    const userDataStr = await SecureStore.getItemAsync('user_data');
    if (!userDataStr) return null;
    return JSON.parse(userDataStr) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fetchCurrentUserFromApi(token: string): Promise<Record<string, unknown> | null> {
  try {
    const data = await apiCall(API_ENDPOINTS.USER.PROFILE.Me, 'GET', undefined, token);
    if (!data || typeof data !== 'object') return null;
    const u = (data as Record<string, unknown>).user;
    if (u && typeof u === 'object' && !Array.isArray(u)) {
      return u as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Prefer live API profile, then fall back to SecureStore.
 * Persists API user to SecureStore when successful.
 */
export async function resolveLatestDepositorName(): Promise<string> {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) {
      const u = await readUserFromSecureStore();
      return extractDepositorDisplayName(u);
    }
    const user = await fetchCurrentUserFromApi(token);
    if (user) {
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      return extractDepositorDisplayName(user);
    }
  } catch (e) {
    console.warn('resolveLatestDepositorName', e);
  }
  const u = await readUserFromSecureStore();
  return extractDepositorDisplayName(u);
}

export type LatestUserSnapshot = {
  /** Label / header (fallback when profile has no name). */
  displayName: string;
  /** Exact profile name for deposit “use my details” (no placeholder default). */
  depositorName: string;
  email: string;
  profilePictureUrl: string | null;
};

/**
 * Same source of truth as resolveLatestDepositorName, plus email and avatar for UI (More tab, etc.).
 */
export async function resolveLatestUserSnapshot(): Promise<LatestUserSnapshot> {
  const token = await SecureStore.getItemAsync('auth_token');
  let user: Record<string, unknown> | null = null;
  if (token) {
    user = await fetchCurrentUserFromApi(token);
    if (user) {
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
    }
  }
  if (!user) {
    user = await readUserFromSecureStore();
  }
  const depositorName = extractDepositorDisplayName(user);
  const displayName = depositorName || 'John Doe';
  const email =
    user && typeof user.email === 'string' && user.email.trim() ? user.email.trim() : 'test@example.com';
  const profilePictureUrl =
    user && typeof user.profile_picture_url === 'string' && user.profile_picture_url.trim()
      ? user.profile_picture_url.trim()
      : null;
  return { displayName, depositorName, email, profilePictureUrl };
}

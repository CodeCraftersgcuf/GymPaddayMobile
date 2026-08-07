import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { apiCall } from './customApiCall';
import { API_ENDPOINTS } from '../apiConfig';

/**
 * The backend treats a user as online when it has seen them within the last few minutes,
 * so ping more often than that window to avoid flapping.
 */
const HEARTBEAT_INTERVAL_MS = 120_000;

async function ping(token: string) {
  try {
    await apiCall(API_ENDPOINTS.USER.PRESENCE.Heartbeat, 'POST', {}, token);
  } catch {
    // Presence is best effort — never surface this to the user.
  }
}

async function goOffline(token: string) {
  try {
    await apiCall(API_ENDPOINTS.USER.PRESENCE.Offline, 'POST', {}, token);
  } catch {
    // Ignore.
  }
}

export function usePresenceHeartbeat(token: string | null) {
  useEffect(() => {
    if (!token) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      ping(token);
      timer = setInterval(() => ping(token), HEARTBEAT_INTERVAL_MS);
    };

    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    start();

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        start();
        return;
      }
      stop();
      goOffline(token);
    });

    return () => {
      stop();
      subscription.remove();
    };
  }, [token]);
}

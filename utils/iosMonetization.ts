import { Platform } from 'react-native';
import { useEffect, useState } from 'react';

/**
 * Legacy constant — use `useIosMonetizationHidden().blocked` for iOS gating.
 * Kept `false` so stale imports do not force-hide on Android.
 */
export const hideIosMonetization = false;

const IOS_STATUS_CHECK_URL = 'https://api.gympaddy.com/api/public/status-check';

/** When `true`, iOS wallet/monetization surfaces stay hidden. Cached per session. */
let cachedMonetizationHidden: boolean | null = null;
let inflightCheck: Promise<boolean> | null = null;

/**
 * iOS only: monetization is shown only when API returns `{ "status": true }`.
 * Until then (loading), on error, or any other value → hidden.
 */
async function fetchMonetizationHiddenFromApi(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const response = await fetch(IOS_STATUS_CHECK_URL, { method: 'GET' });
    const payload = await response.json();
    const enabled = payload?.status === true;
    return !enabled;
  } catch (error) {
    console.warn('iOS status-check failed:', error);
    return true;
  }
}

export async function getIosMonetizationHidden(): Promise<boolean> {
  if (cachedMonetizationHidden != null) return cachedMonetizationHidden;
  if (!inflightCheck) {
    inflightCheck = fetchMonetizationHiddenFromApi().then((hidden) => {
      cachedMonetizationHidden = hidden;
      inflightCheck = null;
      return hidden;
    });
  }
  return inflightCheck;
}

export function useIosMonetizationHidden() {
  const isIos = Platform.OS === 'ios';
  const [loading, setLoading] = useState(isIos);
  const [hidden, setHidden] = useState(isIos);

  useEffect(() => {
    let cancelled = false;
    if (!isIos) {
      setHidden(false);
      setLoading(false);
      return;
    }
    (async () => {
      const hide = await getIosMonetizationHidden();
      if (cancelled) return;
      setHidden(hide);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isIos]);

  /** True on iOS while checking or when API did not return `status: true`. Use for hiding wallet/gifts/boost UI. */
  const blocked = isIos && (loading || hidden);

  return { blocked, hidden, loading };
}

import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://api.gympaddy.com/api/user';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) throw new Error('User not authenticated');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function endStreamCall(callId: string): Promise<void> {
  if (!callId) return;
  const headers = await authHeaders();
  await fetch(`${API_URL}/stream-end-call`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ call_id: callId }),
  }).catch(() => {});
}

export async function getStreamCallStatus(callId: string): Promise<string | null> {
  if (!callId) return null;
  try {
    const headers = await authHeaders();
    const res = await fetch(
      `${API_URL}/stream-call-status?call_id=${encodeURIComponent(callId)}`,
      { headers },
    );
    const json = await res.json();
    return json?.status ? String(json.status) : null;
  } catch {
    return null;
  }
}

export function isCallInactive(status?: string | null): boolean {
  if (!status) return false;
  return ['ended', 'cancelled', 'declined', 'missed'].includes(status.toLowerCase());
}

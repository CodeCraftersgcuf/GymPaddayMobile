// utils/mutations/live.ts
export async function createLiveStream(data: { title: string; agora_channel: string }, token: string) {
  const response = await fetch('https://api.gympaddy.com/api/user/live-streams', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let message = 'Failed to create live stream';
    try {
      const err = await response.json();
      message = err.message || message;
    } catch (_) {}
    const error: any = new Error(message);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

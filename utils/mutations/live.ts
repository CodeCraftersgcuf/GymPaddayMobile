// utils/mutations/live.ts
export async function createLiveStream(data: { title: string; agora_channel: string }, token: string) {
  const response = await fetch('https://gympaddy.hmstech.xyz/api/user/live-streams', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to create live stream');
  }

  return response.json();
}

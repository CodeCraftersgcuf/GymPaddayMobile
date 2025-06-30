export const startCall = async (
  receiverId: number,
  channelName: string,
  type: string = 'voice',
  token: string
) => {
  const response = await fetch('https://gympaddy.hmstech.xyz/api/user/start-call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receiver_id: receiverId,
      channel_name: channelName,
      type,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to start call');
  }

  return await response.json(); // optional
};

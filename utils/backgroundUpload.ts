import Toast from 'react-native-toast-message';

type UploadKind = 'post' | 'story';

function showToast(type: 'info' | 'success' | 'error', title: string, body: string) {
  Toast.show({ type, text1: title, text2: body, visibilityTime: 3500 });
}

/** Local notification when possible; Toast fallback. Never import expo-notifications at top-level (Expo Go RedBox). */
async function showLocalNotification(title: string, body: string) {
  try {
    const Notifications = await import('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted' && existing !== 'denied') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status === 'granted') {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null,
      });
      return;
    }
  } catch {
    /* Expo Go / missing native module — fall through */
  }
  showToast('info', title, body);
}

export function notifyUploadStarted(kind: UploadKind) {
  const label = kind === 'post' ? 'post' : 'story';
  showToast(
    'info',
    'Uploading in background',
    `Your ${label} is uploading. You can keep browsing.`,
  );
}

export async function notifyUploadReceived(kind: UploadKind) {
  if (kind === 'post') {
    await showLocalNotification(
      'Upload complete',
      'We received your post and are processing it. You will be notified when it is live.',
    );
  } else {
    await showLocalNotification(
      'Story upload complete',
      'We received your story and are processing it. You will be notified when it is ready.',
    );
  }
}

export async function notifyUploadFailed(kind: UploadKind, message?: string) {
  const label = kind === 'post' ? 'post' : 'story';
  await showLocalNotification(
    `${label.charAt(0).toUpperCase() + label.slice(1)} upload failed`,
    message || 'Please try again.',
  );
}

export async function notifyPostPublished() {
  await showLocalNotification(
    'Post is live',
    'Your post has been published to the feed.',
  );
  showToast('success', 'Post is live', 'Your post has been published to the feed.');
}

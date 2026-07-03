import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';

type UploadKind = 'post' | 'story';

async function showLocalNotification(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {
    Toast.show({ type: 'info', text1: title, text2: body, visibilityTime: 4000 });
  }
}

export function notifyUploadStarted(kind: UploadKind) {
  const label = kind === 'post' ? 'post' : 'story';
  Toast.show({
    type: 'info',
    text1: 'Uploading in background',
    text2: `Your ${label} is uploading. You can keep browsing.`,
    visibilityTime: 3500,
  });
}

export async function notifyUploadReceived(kind: UploadKind) {
  if (kind === 'post') {
    await showLocalNotification(
      'Upload complete',
      'We received your post and are processing it. You will be notified when it is live.'
    );
  } else {
    await showLocalNotification(
      'Story upload complete',
      'We received your story and are processing it. You will be notified when it is ready.'
    );
  }
}

export async function notifyUploadFailed(kind: UploadKind, message?: string) {
  const label = kind === 'post' ? 'post' : 'story';
  await showLocalNotification(
    `${label.charAt(0).toUpperCase() + label.slice(1)} upload failed`,
    message || 'Please try again.'
  );
}

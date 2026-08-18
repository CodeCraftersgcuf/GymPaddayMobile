import { Audio } from 'expo-av';
import { Platform, Vibration } from 'react-native';

let activeSound: Audio.Sound | null = null;
let vibrating = false;

async function ensurePlaybackMode() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
  });
}

function startVibration() {
  if (vibrating) return;
  vibrating = true;
  // Pattern: wait, vibrate, pause, vibrate… (Android). iOS only supports one-shot.
  if (Platform.OS === 'android') {
    Vibration.vibrate([0, 700, 400, 700, 400, 700], true);
  } else {
    Vibration.vibrate([0, 700, 400, 700]);
  }
}

function stopVibration() {
  vibrating = false;
  Vibration.cancel();
}

/** Looping in-app ringtone + vibration for incoming calls. */
export async function startCallRingtone(): Promise<void> {
  try {
    await stopCallRingtone();
    await ensurePlaybackMode();
    startVibration();

    const { sound } = await Audio.Sound.createAsync(
      require('../assets/music/ringtone.wav'),
      {
        shouldPlay: true,
        isLooping: true,
        volume: 1,
      },
    );
    activeSound = sound;
  } catch (error) {
    console.warn('Failed to start call ringtone:', error);
    // Keep vibration even if audio asset fails.
    startVibration();
  }
}

export async function stopCallRingtone(): Promise<void> {
  stopVibration();
  const sound = activeSound;
  activeSound = null;
  if (!sound) return;
  try {
    await sound.stopAsync();
  } catch {
    /* ignore */
  }
  try {
    await sound.unloadAsync();
  } catch {
    /* ignore */
  }
}

import { Audio } from 'expo-av';
import { Platform, Vibration } from 'react-native';

/** Every Sound we create — stop must kill orphans from raced starts. */
const liveSounds = new Set<Audio.Sound>();
let activeSound: Audio.Sound | null = null;
let vibrating = false;
/** Bumped on every start/stop so late createAsync results are discarded. */
let ringGeneration = 0;

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
  if (Platform.OS === 'android') {
    Vibration.vibrate([0, 700, 400, 700, 400, 700], true);
  } else {
    Vibration.vibrate([0, 700, 400, 700]);
  }
}

function stopVibration() {
  vibrating = false;
  try {
    Vibration.cancel();
  } catch {
    /* ignore */
  }
}

async function killSound(sound: Audio.Sound | null | undefined) {
  if (!sound) return;
  liveSounds.delete(sound);
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

/** Looping in-app ringtone + vibration for incoming calls. */
export async function startCallRingtone(): Promise<void> {
  const generation = ++ringGeneration;

  try {
    await stopCallRingtone({ preserveGeneration: true });
    if (generation !== ringGeneration) return;

    await ensurePlaybackMode();
    if (generation !== ringGeneration) return;

    startVibration();

    const { sound } = await Audio.Sound.createAsync(
      require('../assets/music/ringtone.wav'),
      {
        shouldPlay: true,
        isLooping: true,
        volume: 1,
      },
    );

    // Hang-up (or a newer start) happened while createAsync was in flight.
    if (generation !== ringGeneration) {
      await killSound(sound);
      return;
    }

    liveSounds.add(sound);
    activeSound = sound;
  } catch (error) {
    console.warn('Failed to start call ringtone:', error);
    if (generation === ringGeneration) {
      startVibration();
    }
  }
}

type StopOptions = {
  /** Used internally by start so it can clear previous sounds without bumping gen twice. */
  preserveGeneration?: boolean;
};

/** Stop ringtone + vibration. Safe to call many times; kills orphaned Sound instances too. */
export async function stopCallRingtone(options: StopOptions = {}): Promise<void> {
  if (!options.preserveGeneration) {
    ringGeneration += 1;
  }
  stopVibration();

  const primary = activeSound;
  activeSound = null;

  const orphans = Array.from(liveSounds);
  liveSounds.clear();

  await Promise.all([
    killSound(primary),
    ...orphans.map((sound) => killSound(sound)),
  ]);
}

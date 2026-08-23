import type { Call, StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { callManager } from '@stream-io/video-react-native-sdk';
import { Audio } from 'expo-av';
import { stopCallRingtone } from '@/utils/callRingtone';

type TeardownOptions = {
  call?: Call | null;
  client?: StreamVideoClient | null;
  /** When true, mark the call ended for everyone on Stream, then leave locally. */
  endForEveryone?: boolean;
};

function stopLegacyInCallManager() {
  try {
    // Optional peer dep used by Stream CallContent — stop if present.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const InCallManager = require('react-native-incall-manager').default;
    InCallManager?.stop?.();
    InCallManager?.setKeepScreenOn?.(false);
  } catch {
    /* not installed / already stopped */
  }
}

function stopStreamCallManager() {
  try {
    callManager.stop();
  } catch {
    /* ignore */
  }
}

/**
 * Fully stop Stream media so hang-up cannot leave ghost audio/video playing
 * after the call UI navigates away.
 *
 * Important: Stream's API is `call.endCall()`, not `call.end()`.
 * Calling a missing `.end()` is a silent no-op and never reaches `leave()`,
 * which leaves remote audio playing in the background.
 */
export async function teardownStreamCall({
  call,
  client,
  endForEveryone = false,
}: TeardownOptions): Promise<void> {
  await stopCallRingtone();

  if (call) {
    try {
      await call.camera.disable(true);
    } catch {
      /* ignore */
    }
    try {
      await call.microphone.disable(true);
    } catch {
      /* ignore */
    }

    // Stop remote audio as fast as possible — leave tears down subscriber/publisher.
    if (endForEveryone) {
      try {
        await call.endCall();
      } catch {
        /* remote may already have ended */
      }
    }

    try {
      await call.leave({ reason: 'user hangup' });
    } catch {
      /* already left */
    }
  }

  stopStreamCallManager();
  stopLegacyInCallManager();

  if (client) {
    try {
      await client.disconnectUser();
    } catch {
      /* ignore */
    }
  }

  // Belt-and-suspenders: stop managers again after disconnect.
  stopStreamCallManager();
  stopLegacyInCallManager();

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    /* ignore */
  }
}

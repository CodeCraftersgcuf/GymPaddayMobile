import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  type IRtcEngine,
} from 'react-native-agora';
import { AGORA_LIVE_APP_ID } from '@/utils/liveStreamWebHtml';

interface Props {
  token: string;
  channelName: string;
  uid: number;
  role: 'host' | 'audience';
  showControls?: boolean;
}

export type LiveStreamingPlayerHandle = {
  toggleMic: () => void;
  toggleCamera: () => void;
  switchCamera: () => void;
};

const LiveStreamingPlayer = forwardRef<LiveStreamingPlayerHandle, Props>(function LiveStreamingPlayer(
  { token, channelName, uid, role, showControls = true },
  ref,
) {
  const engineRef = useRef<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Starting camera…');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [usingFrontCamera, setUsingFrontCamera] = useState(true);

  useImperativeHandle(ref, () => ({
    toggleMic: () => {
      const engine = engineRef.current;
      if (!engine || role !== 'host') return;
      setMicOn((prev) => {
        const next = !prev;
        try {
          engine.muteLocalAudioStream(!next);
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    toggleCamera: () => {
      const engine = engineRef.current;
      if (!engine || role !== 'host') return;
      setCamOn((prev) => {
        const next = !prev;
        try {
          engine.muteLocalVideoStream(!next);
          engine.enableLocalVideo(next);
          if (next) engine.startPreview();
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    switchCamera: () => {
      const engine = engineRef.current;
      if (!engine || role !== 'host' || !camOn) return;
      try {
        engine.switchCamera();
        setUsingFrontCamera((prev) => !prev);
      } catch {
        /* ignore */
      }
    },
  }));

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);
          const camOk =
            granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
          const micOk =
            granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
            PermissionsAndroid.RESULTS.GRANTED;
          if (!camOk || !micOk) {
            setError('Camera and microphone permission required');
            return;
          }
        }

        if (!token) {
          setError('Missing Agora token');
          return;
        }

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;

        engine.initialize({
          appId: AGORA_LIVE_APP_ID,
          channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        });

        const clientRole =
          role === 'host'
            ? ClientRoleType.ClientRoleBroadcaster
            : ClientRoleType.ClientRoleAudience;

        engine.setClientRole(clientRole);
        engine.enableAudio();
        engine.setDefaultAudioRouteToSpeakerphone(true);
        engine.setEnableSpeakerphone(true);

        if (role === 'host') {
          engine.enableLocalAudio(true);
          engine.muteLocalAudioStream(false);
          engine.enableVideo();
          engine.enableLocalVideo(true);
          engine.muteLocalVideoStream(false);
          engine.startPreview();
          setStatus('Joining channel…');
        } else {
          engine.enableVideo();
          engine.enableAudio();
          setStatus('Waiting for host…');
        }

        engine.registerEventHandler({
          onJoinChannelSuccess: () => {
            if (cancelled) return;
            setJoined(true);
            setStatus('');
            if (role === 'host') {
              try {
                engine.muteLocalAudioStream(false);
                engine.muteLocalVideoStream(false);
              } catch {
                /* ignore */
              }
            }
          },
          onUserJoined: (remote) => {
            if (cancelled) return;
            setRemoteUid(remote);
            try {
              engine.muteRemoteVideoStream(remote, false);
              engine.muteRemoteAudioStream(remote, false);
            } catch {
              /* ignore */
            }
          },
          onUserOffline: () => {
            if (cancelled) return;
            setRemoteUid(null);
          },
          onError: (errCode) => {
            if (cancelled) return;
            console.warn('[AGORA LIVE] error', errCode);
            setError(`Agora error ${errCode}`);
          },
        });

        engine.joinChannel({
          token,
          channelId: channelName,
          uid,
          options: {
            clientRoleType: clientRole,
            publishMicrophoneTrack: role === 'host',
            publishCameraTrack: role === 'host',
            autoSubscribeAudio: true,
            autoSubscribeVideo: true,
          },
        });
      } catch (err: any) {
        if (cancelled) return;
        console.warn('[AGORA LIVE] init failed', err);
        setError(err?.message || 'Failed to start live camera');
      }
    };

    init();

    return () => {
      cancelled = true;
      const engine = engineRef.current;
      engineRef.current = null;
      if (engine) {
        try {
          engine.stopPreview();
          engine.leaveChannel();
          engine.release();
        } catch {
          /* ignore */
        }
      }
    };
  }, [token, channelName, uid, role]);

  const toggleMic = () => {
    const engine = engineRef.current;
    if (!engine || role !== 'host') return;
    const next = !micOn;
    try {
      engine.muteLocalAudioStream(!next);
      setMicOn(next);
    } catch {
      /* ignore */
    }
  };

  const toggleCam = () => {
    const engine = engineRef.current;
    if (!engine || role !== 'host') return;
    const next = !camOn;
    try {
      engine.muteLocalVideoStream(!next);
      engine.enableLocalVideo(next);
      if (next) {
        engine.startPreview();
      }
      setCamOn(next);
    } catch {
      /* ignore */
    }
  };

  const flipCamera = () => {
    const engine = engineRef.current;
    if (!engine || role !== 'host' || !camOn) return;
    try {
      engine.switchCamera();
      setUsingFrontCamera((prev) => !prev);
    } catch {
      /* ignore */
    }
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!joined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C61F3A" />
        <Text style={styles.statusText}>{status}</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {role === 'host' ? (
        camOn ? (
          <RtcSurfaceView canvas={{ uid: 0, renderMode: 1 }} style={styles.flex} />
        ) : (
          <View style={styles.center}>
            <Ionicons name="videocam-off" size={48} color="#888" />
            <Text style={styles.statusText}>Camera off</Text>
          </View>
        )
      ) : remoteUid != null ? (
        <RtcSurfaceView canvas={{ uid: remoteUid, renderMode: 1 }} style={styles.flex} />
      ) : (
        <View style={styles.center}>
          <Text style={styles.statusText}>Waiting for host video…</Text>
        </View>
      )}

      {role === 'host' && showControls ? (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, !micOn && styles.controlBtnOff]}
            onPress={toggleMic}
            activeOpacity={0.85}
          >
            <Ionicons name={micOn ? 'mic' : 'mic-off'} size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, !camOn && styles.controlBtnOff]}
            onPress={toggleCam}
            activeOpacity={0.85}
          >
            <Ionicons name={camOn ? 'videocam' : 'videocam-off'} size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={flipCamera}
            activeOpacity={0.85}
            disabled={!camOn}
          >
            <Ionicons
              name={usingFrontCamera ? 'camera-reverse-outline' : 'camera-outline'}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
});

export default LiveStreamingPlayer;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  statusText: { color: '#fff', marginTop: 12, textAlign: 'center' },
  errorText: { color: '#ff8a80', textAlign: 'center' },
  controls: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(42,42,42,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnOff: {
    backgroundColor: '#C61F3A',
  },
});

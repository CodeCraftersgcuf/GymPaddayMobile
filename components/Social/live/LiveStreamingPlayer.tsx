import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
} from 'react-native-agora';

const APP_ID = '594b734537da44b7994c6a0194c25ffb'; // your actual app ID

interface Props {
  token?: string; // use empty string if you are not using tokens
  channelName: string;
  uid: number;
  role: 'host' | 'audience';
}

export default function LiveStreamingPlayer({ channelName, uid, role }: Props) {
  const engineRef = useRef<any>(null);

  const [joined, setJoined] = useState(false);
  const [localUid, setLocalUid] = useState<number | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [cameraWorking, setCameraWorking] = useState<'pending' | 'ok' | 'fail'>('pending');
  const [previewActive, setPreviewActive] = useState(false);
  const [status, setStatus] = useState<string[]>([]);

  const log = (...args: any[]) => {
    console.log('[AGORA]', ...args);
    setStatus((prev) => [...prev.slice(-15), args.map(String).join(' ')]);
  };

  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
        const allGranted = Object.values(granted).every(
          (v) => v === PermissionsAndroid.RESULTS.GRANTED
        );
        if (!allGranted) {
          setCameraWorking('fail');
          return;
        }
      }

      const engine = createAgoraRtcEngine();
      engineRef.current = engine;

      log('Initializing Agora...');
      engine.initialize({ appId: APP_ID });
      engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
      engine.setClientRole(
        role === 'host'
          ? ClientRoleType.ClientRoleBroadcaster
          : ClientRoleType.ClientRoleAudience
      );

      engine.enableVideo();
      engine.enableAudio();
      engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
      engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      engine.enableVideo();
      engine.enableAudio();
      engine.enableLocalVideo(true);
      engine.enableLocalAudio(true);

      if (role === 'host') {
        try {
          await engine.startPreview();
          setCameraWorking('ok');
          log('startPreview() success');

        } catch (err) {
          setCameraWorking('fail');
          log('startPreview() failed:', err);
        }
      }

      engine.addListener('onJoinChannelSuccess', (channel, actualUid, elapsed) => {
        log('JoinChannelSuccess', JSON.stringify({ channel, actualUid, elapsed }));
        setLocalUid(actualUid);
        setJoined(true);
      });

      engine.addListener('onUserJoined', (uid) => {
        log('Remote user joined:', uid);
        setRemoteUid(uid);
      });

      engine.addListener('onUserOffline', (uid) => {
        log('Remote user left:', uid);
        setRemoteUid(null);
      });

      engine.addListener('onError', (err, msg) => {
        log('[ENGINE ERROR]', err, msg);
        setCameraWorking('fail');
      });

      engine.addListener('onWarning', (warn, msg) => {
        log('[ENGINE WARNING]', warn, msg);
      });

      try {
        log('Joining channel...', JSON.stringify({ channelName, uid }));
        await engine.joinChannel(null, channelName, uid, {
          clientRoleType:
            role === 'host'
              ? ClientRoleType.ClientRoleBroadcaster
              : ClientRoleType.ClientRoleAudience,
        });
       

        log('joinChannel() called.');
      } catch (err) {
        log('[ERROR] joinChannel failed:', err);
      }
    };
    

    init();

    return () => {
      if (engineRef.current) {
        log('Cleaning up Agora...');
        engineRef.current.leaveChannel();
        engineRef.current.release();
        engineRef.current = null;
      }
    };
  }, [channelName, uid, role]);

  if (!joined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="tomato" />
        <Text style={{ color: '#fff', textAlign: 'center', margin: 10 }}>Joining channel...</Text>
        <StatusConsole status={status} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Text style={{ color: '#fff', textAlign: 'center', margin: 8 }}>
        You are a {role === 'host' ? 'Host' : 'Audience'}
      </Text>

      <View style={{ flex: 1 }}>
        {/* Host: Show their own camera */}
        {role === 'host' && localUid !== null && (
          <RtcSurfaceView
            canvas={{ uid: 0, renderMode: 1 }}
            style={{ flex: 1, backgroundColor: cameraWorking === 'ok' ? '#000' : '#600' }}
            onLayout={() => {
              if (!previewActive) {
                setPreviewActive(true);
                log('✅ Camera preview rendered (RtcSurfaceView onLayout, localUid=' + localUid + ').');
              }
            }}
          />
        )}

        {/* Audience: Show host video */}
        {role === 'audience' && remoteUid !== null && (
          <RtcSurfaceView
            canvas={{ uid: remoteUid, renderMode: 1 }}
            style={{ flex: 1, backgroundColor: '#222' }}
          />
        )}
      </View>

      <StatusConsole status={status} />
    </View>
  );
}

function StatusConsole({ status }: { status: string[] }) {
  if (!status.length) return null;
  return (
    <View style={{ backgroundColor: '#111', padding: 8, marginTop: 10 }}>
      <Text style={{ color: '#fff', fontSize: 12, marginBottom: 4 }}>Logs:</Text>
      {status.map((line, i) => (
        <Text key={i} style={{ color: '#ccc', fontSize: 10 }}>{line}</Text>
      ))}
    </View>
  );
}

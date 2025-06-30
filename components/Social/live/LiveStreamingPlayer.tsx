import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
} from 'react-native-agora';

const APP_ID = '2fae578d9eef4fe19df335eb67227571';

interface Props {
  token: string;
  channelName: string;
  uid: number;
  role: 'host' | 'audience';
}

export default function LiveStreamingPlayer({ token, channelName, uid, role }: Props) {
  const engineRef = useRef<any>(null);

  const [joined, setJoined] = useState(false);
  const [localUid, setLocalUid] = useState<number | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [cameraWorking, setCameraWorking] = useState<'pending' | 'ok' | 'fail'>('pending');
  const [previewActive, setPreviewActive] = useState(false);
  const [status, setStatus] = useState<string[]>([]);

  const log = React.useCallback((...args: any[]) => {
    console.log('[AGORA]', ...args);
    setStatus(prev => [...prev.slice(-10), args.map(String).join(' ')]);
  }, []);

  useEffect(() => {
    async function requestPermissionsAndInit() {
      if (Platform.OS === 'android') {
        log('Requesting camera/mic permissions...');
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
        log('Permissions result:', JSON.stringify(granted));
        const allGranted = Object.values(granted).every(
          v => v === PermissionsAndroid.RESULTS.GRANTED
        );
        if (!allGranted) {
          log('[ERROR] Permissions not granted!');
          setCameraWorking('fail');
          return;
        } else {
          log('All permissions granted.');
        }
      }

      log('Creating Agora engine...');
      const engine = createAgoraRtcEngine();
      engineRef.current = engine;

      engine.initialize({ appId: APP_ID });
      log('Agora engine initialized.');

      engine.enableVideo();
      log('Video enabled.');

      engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
      engine.setClientRole(
        role === 'host'
          ? ClientRoleType.ClientRoleBroadcaster
          : ClientRoleType.ClientRoleAudience
      );
      log('Set channelProfile and clientRole:', role);

      if (role === 'host') {
        log('Starting local preview...');
        try {
          engine.startPreview();
          setCameraWorking('ok');
          log('startPreview() success.');
        } catch (e) {
          setCameraWorking('fail');
          log('[ERROR] startPreview() failed:', e);
        }
      }

      engine.addListener('onJoinChannelSuccess', (channel, actualLocalUid, elapsed) => {
        log('JoinChannelSuccess', JSON.stringify({ channel, actualLocalUid, elapsed }));
        setLocalUid(actualLocalUid);
        setJoined(true);
      });

      engine.addListener('onUserJoined', (remoteUid) => {
        log('UserJoined', remoteUid);
        setRemoteUid(remoteUid);
      });

      engine.addListener('onUserOffline', (uid) => {
        log('UserOffline', uid);
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
        log('Joining channel...', JSON.stringify({ token, channelName, uid }));
        engine.joinChannel(token, channelName, uid, {
          clientRoleType:
            role === 'host'
              ? ClientRoleType.ClientRoleBroadcaster
              : ClientRoleType.ClientRoleAudience,
        });
        log('joinChannel called.');
      } catch (e) {
        log('[ERROR] joinChannel failed:', e);
        setCameraWorking('fail');
      }
    }

    requestPermissionsAndInit();

    return () => {
      log('Cleaning up Agora engine...');
      if (engineRef.current) {
        engineRef.current.leaveChannel();
        engineRef.current.release();
        engineRef.current = null;
      }
    };
  }, [token, channelName, uid, role, log]);

  useEffect(() => {
    log(joined ? 'Joined channel.' : 'Not joined yet.');
  }, [joined, log]);

  if (!joined || !localUid) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="tomato" />
        <Text style={{ color: '#fff', textAlign: 'center', margin: 10 }}>Joining channel...</Text>
        <StatusConsole status={status} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#222' }}>
      <Text style={{ color: '#fff', textAlign: 'center', margin: 8 }}>
        You are a {role === 'host' ? 'Host (Broadcaster)' : 'Audience'}
      </Text>
      <Text style={{ color: '#aaa', textAlign: 'center', fontSize: 11, marginBottom: 4 }}>
        Channel: {channelName} | Your UID: {localUid}
      </Text>
      <StatusConsole status={status} />

      <View style={{ flex: 1 }}>
        {/* Show your own video even if you are host! */}
        {role === 'host' && localUid && (
          <>
            <Text
              style={{
                color: cameraWorking === 'ok' ? 'lime' : cameraWorking === 'fail' ? 'red' : '#ff0',
                textAlign: 'center',
                fontSize: 12,
              }}
            >
              {cameraWorking === 'ok'
                ? previewActive
                  ? '✅ Camera preview showing'
                  : '🕒 Camera preview area created, waiting for video...'
                : cameraWorking === 'fail'
                ? 'Camera failed (see logs)'
                : 'Camera status: pending...'}
            </Text>
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
          </>
        )}

        {/* Remote user */}
        {remoteUid && (
          <>
            <Text style={{ color: 'orange', fontSize: 10, textAlign: 'center' }}>
              Remote UID: {remoteUid}
            </Text>
            <RtcSurfaceView
              canvas={{ uid: remoteUid, renderMode: 1 }}
              style={{
                width: 120,
                height: 120,
                margin: 4,
                borderRadius: 8,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: '#444',
              }}
            />
          </>
        )}
      </View>
    </View>
  );
}

function StatusConsole({ status }: { status: string[] }) {
  if (!status.length) return null;
  return (
    <View style={{ backgroundColor: '#222', padding: 6, marginVertical: 2 }}>
      <Text style={{ color: '#fff', fontSize: 11 }}>Logs:</Text>
      {status.map((line, i) => (
        <Text key={i} style={{ color: '#bbb', fontSize: 10 }}>
          {line}
        </Text>
      ))}
    </View>
  );
}

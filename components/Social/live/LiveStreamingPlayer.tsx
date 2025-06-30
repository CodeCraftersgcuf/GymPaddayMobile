import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import {
  createAgoraRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine
} from 'react-native-agora';

const APP_ID = '2fae578d9eef4fe19df335eb67227571';

interface Props {
  token: string;
  channelName: string;
  uid: number;
  role: 'host' | 'audience';
}

export default function LiveStreamingPlayer({ token, channelName, uid, role }: Props) {
  const engineRef = useRef<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log('[INIT] Initializing Agora LiveStreamingPlayer');

      if (Platform.OS === 'android') {
        console.log('[PERMISSION] Requesting Android camera and mic permissions');
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);

        const allGranted = Object.values(granted).every(
          val => val === PermissionsAndroid.RESULTS.GRANTED
        );
        if (!allGranted) {
          console.warn('[PERMISSION] Required permissions not granted:', granted);
          return;
        }
        console.log('[PERMISSION] All permissions granted');
      }

      try {
        const engine = createAgoraRtcEngine();
        engineRef.current = engine;

        console.log('[ENGINE] Initializing with appId:', APP_ID);
        engine.initialize({ appId: APP_ID });

        console.log('[ENGINE] Enabling video');
        engine.enableVideo();

        console.log('[ENGINE] Setting channel profile to LIVE_BROADCASTING');
        engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);

        const clientRole = role === 'host'
          ? ClientRoleType.ClientRoleBroadcaster
          : ClientRoleType.ClientRoleAudience;

        console.log(`[ENGINE] Setting client role: ${role} (${clientRole})`);
        engine.setClientRole(clientRole);

        // Events
        engine.addListener('onJoinChannelSuccess', (channel, uid, elapsed) => {
          console.log(`[EVENT] Joined channel: ${channel}, UID: ${uid}, Elapsed: ${elapsed}ms`);
          setJoined(true);
        });

        engine.addListener('onError', (errCode, msg) => {
          console.error(`[AGORA ERROR] ${errCode}: ${msg}`);
        });

        engine.addListener('onUserJoined', remoteUid => {
          console.log(`[EVENT] Remote user joined: ${remoteUid}`);
        });

        engine.addListener('onCameraReady', () => {
          console.log('[CAMERA] Camera is ready and rendering');
        });

        console.log('[ENGINE] Joining channel with token');
        engine.joinChannel(token, channelName, uid);

        if (role === 'host') {
          console.log('[ENGINE] Starting camera preview for host');
          engine.startPreview();
        }
      } catch (err) {
        console.error('[ENGINE] Error during initialization:', err);
      }
    };

    init();

    return () => {
      console.log('[CLEANUP] Leaving channel and releasing engine');
      if (engineRef.current) {
        engineRef.current.leaveChannel();
        engineRef.current.release();
        engineRef.current = null;
      }
    };
  }, []);

  if (!joined) {
    console.log('[UI] Not joined yet – showing loader');
    return <ActivityIndicator size="large" style={{ flex: 1 }} color="tomato" />;
  }

  console.log(`[UI] Rendering live video view as ${role}`);
  return (
    <View style={{ flex: 1 }}>
      <RtcSurfaceView
        canvas={{ uid: role === 'host' ? uid : 0 }}
        style={{ flex: 1 }}
        zOrderMediaOverlay={true}
      />
    </View>
  );
}

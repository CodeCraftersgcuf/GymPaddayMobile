import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  AgoraVideoView,
  VideoRenderModeType,
} from 'react-native-agora';
import { useMutation } from '@tanstack/react-query';
import {
  startVideoCall,
  endVideoCall,
  getVideoToken,
} from '@/utils/mutations/video';
import * as SecureStore from 'expo-secure-store';

const APP_ID = '2fae578d9eef4fe19df335eb67227571';
const CHANNEL_NAME = 'user_1_2_1719499000';

const HARDCODED_CALL_DATA = {
  receiver_id: 2,
  channel_name: CHANNEL_NAME,
  type: 'video',
};

export default function AgoraCallScreen() {
  const navigation = useNavigation();
  const [joined, setJoined] = useState(false);
  const [callId, setCallId] = useState<number | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [localUid, setLocalUid] = useState<number | null>(null);
  const engineRef = useRef(null);

  const getAuthToken = async () => {
    return await SecureStore.getItemAsync('auth_token');
  };

  const startCallMutation = useMutation({
    mutationFn: async () => {
      const token = await getAuthToken();
      console.log('Starting video call with dummy data:', HARDCODED_CALL_DATA);
      return await startVideoCall(HARDCODED_CALL_DATA, token!);
    },
    onSuccess: (res) => {
      console.log('Start call API success:', res);
      setCallId(res?.id ?? null);
    },
    onError: (err) => {
      console.error('Start call API failed:', err);
    },
  });

  const endCallMutation = useMutation({
    mutationFn: async () => {
      const token = await getAuthToken();
      if (callId) {
        console.log('[VideoCall] Ending call with call ID:', callId);
        await endVideoCall(
          {
            call_id: callId,
            channel_name: CHANNEL_NAME,
          },
          token!
        );
        console.log('[VideoCall] End call API success');
      } else {
        console.warn('[VideoCall] No call ID available to end call.');
      }
    },
    onError: (err) => {
      console.warn('[VideoCall] End call API failed:', err);
    },
  });

  useEffect(() => {
    const init = async () => {
      try {
        if (Platform.OS === 'android') {
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.CAMERA,
          ]);
        }

        const uid = Math.floor(Math.random() * 100000);
        const authToken = await getAuthToken();
        const tokenResponse = await getVideoToken(
          { channel_name: CHANNEL_NAME, uid },
          authToken!
        );
        const fetchedToken = tokenResponse?.token;

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;

        engine.initialize({
          appId: APP_ID,
          channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        });

        engine.enableVideo();
        engine.startPreview();

        engine.registerEventHandler({
          onJoinChannelSuccess: (_channel, uid, _elapsed) => {
            console.log('Joined channel successfully with UID:', uid);
            setJoined(true);
            setLocalUid(uid);
          },
          onUserJoined: (uid, _elapsed) => {
            console.log('Remote user joined:', uid);
            setRemoteUid(uid);
          },
          onUserOffline: (uid, reason) => {
            console.log('Remote user left:', uid, reason);
            setRemoteUid(null);
          },
        });

        engine.joinChannel({
          token: fetchedToken,
          channelId: CHANNEL_NAME,
          uid,
          options: {
            clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          },
        });

        startCallMutation.mutate();
      } catch (err) {
        console.error('Agora init error:', err);
        Alert.alert('Agora Error', err?.message || 'Failed to initialize call');
        navigation.goBack();
      }
    };

    init();

    return () => {
      if (engineRef.current) {
        engineRef.current.leaveChannel();
        engineRef.current.release();
      }
    };
  }, []);

  const handleEndCall = async () => {
    try {
      console.log('[Agora] handleEndCall triggered');
      if (engineRef.current) {
        console.log('[Agora] Leaving channel and releasing engine...');
        await engineRef.current.leaveChannel();
        engineRef.current.release();
      } else {
        console.warn('[Agora] No engine found to clean up.');
      }

      endCallMutation.mutate();
    } catch (err) {
      console.warn('[Agora] Error during handleEndCall:', err);
    } finally {
      console.log('[Agora] Navigating back after call end');
      navigation.goBack();
    }
  };

 return (
  <View style={styles.container}>
    <Text style={styles.title}>
      Agora Call {joined ? 'Connected ✅' : 'Connecting...'}
    </Text>

    {/* Remote Video */}
    {remoteUid !== null && (
      <AgoraVideoView
        style={styles.remoteVideo}
        renderMode={VideoRenderModeType.VideoRenderModeHidden}
        connection={{ channelId: CHANNEL_NAME, uid: remoteUid }}
        viewType={0} // SurfaceView
      />
    )}

    {/* Local Video */}
    {localUid !== null && (
      <AgoraVideoView
        style={styles.localVideo}
        renderMode={VideoRenderModeType.VideoRenderModeHidden}
        connection={{ channelId: CHANNEL_NAME, uid: localUid }}
        viewType={0} // SurfaceView
      />
    )}

    <Button title="End Call" onPress={handleEndCall} />
  </View>
);

}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  localVideo: {
    width: 120,
    height: 180,
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
});

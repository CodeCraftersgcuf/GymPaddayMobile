import { useState, useRef, useEffect } from 'react';
import {
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
} from 'react-native-agora';
import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import {
  startVideoCall,
  endVideoCall,
  getVideoToken
} from '@/utils/mutations/video';

const APP_ID = '2fae578d9eef4fe19df335eb67227571';

export function useAgoraCall({
  receiverId,
  callType = 'video',
  onCallEnded,
    channelName: providedChannelName,

}: {
  receiverId: number;
  callType?: 'video' | 'voice';
  onCallEnded?: () => void;
    channelName?: string; // <-- added here


}) {
  const [joined, setJoined] = useState(false);
  const [callId, setCallId] = useState<number | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [localUid, setLocalUid] = useState<number | null>(null);
  const [channelName, setChannelName] = useState('');
  const engineRef = useRef<IRtcEngine | null>(null);

  const getAuthToken = async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) throw new Error('No auth token found');
    return token;
  };

  const startCallMutation = useMutation({
    mutationFn: async ({ channel }: { channel: string }) => {
      const token = await getAuthToken();
      return await startVideoCall({
        receiver_id: receiverId,
        channel_name: channel,
        type: callType,
      }, token);
    },
    onSuccess: (res) => {
      console.log('✅ Call started:', res);
      setCallId(res?.id ?? null);
    },
    onError: (err) => {
      console.error('❌ Failed to start call:', err);
    },
  });

  const endCallMutation = useMutation({
    mutationFn: async () => {
      const token = await getAuthToken();
      if (callId) {
        await endVideoCall({ call_id: callId, channel_name: channelName }, token);
      }
    },
    onSettled: () => {
      console.log('📞 Call ended cleanup');
      onCallEnded?.();
    },
  });

  const init = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
        const allGranted = Object.values(granted).every(val => val === 'granted');
        if (!allGranted) throw new Error('Required permissions not granted');
      }

      const uid = Math.floor(Math.random() * 100000);
const channel = providedChannelName || `call_${receiverId}`;
      setChannelName(channel);
      setLocalUid(uid);

      const token = await getAuthToken();
      const { token: fetchedToken } = await getVideoToken({ channel_name: channel, uid }, token);

      const engine = createAgoraRtcEngine();
      engine.initialize({
        appId: APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });
      engineRef.current = engine;

      // ✅ Set role and audio/video config
      engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      engine.enableAudio();
      engine.enableLocalAudio(true);
      engine.setEnableSpeakerphone(true);

      if (callType === 'video') {
        engine.enableVideo();
        engine.enableLocalVideo(true);
        engine.startPreview();
      }

      engine.registerEventHandler({
        onJoinChannelSuccess: (channel, uid, elapsed) => {
          console.log(`✅ Local user joined: ${uid} in channel: ${channel} (${elapsed}ms)`);
          setJoined(true);
        },
        onUserJoined: (uid, elapsed) => {
          console.log(`👤 Remote user joined: ${uid} after ${elapsed}ms`);
          setRemoteUid(uid);
          engine.subscribeRemoteVideoStream(uid, true);
          engine.subscribeRemoteAudioStream(uid, true);
        },
        onUserOffline: (uid, reason) => {
          console.log(`❌ Remote user left: ${uid}, reason: ${reason}`);
          setRemoteUid(null);
        },
        onLeaveChannel: (stats) => {
          console.log('🔚 Left channel. Stats:', stats);
          setJoined(false);
          setRemoteUid(null);
        },
        onRemoteVideoStateChanged: (uid, state, reason, elapsed) => {
          console.log(`📺 Remote video state: uid=${uid}, state=${state}, reason=${reason}`);
        },
        onRemoteAudioStateChanged: (uid, state, reason, elapsed) => {
          console.log(`🔊 Remote audio state: uid=${uid}, state=${state}, reason=${reason}`);
        },
        onError: (errCode) => {
          console.error('🛑 Agora Error:', errCode);
        },
      });

      engine.joinChannel({
        token: fetchedToken,
        channelId: channel,
        uid,
        options: {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        },
      });

      startCallMutation.mutate({ channel });

    } catch (err: any) {
      Alert.alert('Agora Error', err.message ?? 'Unknown error');
      console.error('🚨 Agora Init Failed:', err);
      onCallEnded?.();
    }
  };

  const endCall = async () => {
    try {
      if (engineRef.current) {
        await engineRef.current.leaveChannel();
        engineRef.current.release();
        engineRef.current = null;
      }
      endCallMutation.mutate();
    } catch (err) {
      console.error('⚠️ Error ending call:', err);
    }
  };

  useEffect(() => {
    init();
    return () => {
      if (engineRef.current) {
        engineRef.current.leaveChannel();
        engineRef.current.release();
        engineRef.current = null;
      }
    };
  }, []);

  return {
    joined,
    localUid,
    remoteUid,
    channelName,
    endCall,
  };
}

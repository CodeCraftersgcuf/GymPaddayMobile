// app/VoiceCallScreen.tsx

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, PermissionsAndroid } from 'react-native';
import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} from 'react-native-agora';
import { useLocalSearchParams, useRouter } from 'expo-router';

const APP_ID = '594b734537da44b7994c6a0194c25ffb';

export default function VoiceCallScreen() {
  const { channelName, uid, type } = useLocalSearchParams();
  const router = useRouter();

  const engineRef = useRef<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const numericUid = parseInt(uid);

  const onEnd = () => {
    console.log("Call ending...");
    leaveCall().finally(() => {
      console.log("Navigating back");
      router.back();
    });
  };

  const initAgora = async () => {
    try {
      console.log("Initializing Agora...");

      if (!channelName || isNaN(numericUid)) {
        throw new Error('Missing channelName or uid');
      }

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Microphone permission not granted');
        }
      }

      console.log('✅ Params:', { channelName, numericUid, type });

      const engine = createAgoraRtcEngine();
      console.log("✅ Agora engine created");

      engine.initialize({
        appId: APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });
      engineRef.current = engine;

      engine.registerEventHandler({
        onJoinChannelSuccess: (channel, uid, elapsed) => {
          console.log(`✅ Joined channel: ${channel}, UID: ${uid}, elapsed: ${elapsed}`);
          setJoined(true);
        },
        onUserJoined: (remoteUid, elapsed) => {
          console.log(`👤 Remote user joined: ${remoteUid}, elapsed: ${elapsed}`);
          setRemoteJoined(true); // ✅ Make sure to update this
        },
        onUserOffline: (remoteUid, reason) => {
          console.log(`🚪 Remote user left: ${remoteUid}, reason: ${reason}`);
          onEnd();
        },
        onError: (errCode) => {
          console.error('❌ Agora Error:', errCode);
        },
      });

      await engine.enableAudio();
      await engine.setEnableSpeakerphone(true);
      await engine.setDefaultAudioRouteToSpeakerphone(true);

      console.log("🚀 Joining channel...", channelName, numericUid);

      // ✅ Use empty token
     const response= await engine.joinChannel(
       
        channelName as string, // channelId
        numericUid, // uid
        { clientRoleType: ClientRoleType.ClientRoleBroadcaster } // options
      );

      console.log("🟢 joinChannel() executed",response);

    } catch (err: any) {
      console.error('❌ [initAgora Error]', err);
      Alert.alert('Error', err.message || 'Unknown error');
      onEnd();
    }
  };

  const leaveCall = async () => {
    try {
      console.log("Leaving call...");
      await engineRef.current?.leaveChannel();
      engineRef.current?.release();
      engineRef.current = null;
      console.log("🛑 Call left & engine released");
    } catch (e) {
      console.error('❌ Error leaving call:', e);
    }
  };

  useEffect(() => {
    initAgora();
    return () => {
      leaveCall();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {joined ? (remoteJoined ? 'Connected to remote user' : 'Waiting for other user...') : 'Joining call...'}
      </Text>
      <TouchableOpacity style={styles.endButton} onPress={onEnd}>
        <Text style={styles.buttonText}>End Call</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 22, marginBottom: 20 },
  endButton: { backgroundColor: 'red', padding: 16, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});

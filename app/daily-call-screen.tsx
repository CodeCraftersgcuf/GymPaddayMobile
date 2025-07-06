import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
import * as SecureStore from 'expo-secure-store';
export default function DailyCallScreen() {
  const { roomUrl, type, callType, channelName } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const webViewRef = React.useRef(null);
  console.log("calltype", callType, "channnel name", channelName, "type", type)
  // Use custom hosted voice-only HTML page
  // Define the URL based on call type
  const callUrl =
    callType === 'voice'
      ? `https://hmstech.xyz/agora.html?role=${type}&room=${channelName}`
      : roomUrl
  const getToken = async () => {
    return await SecureStore.getItemAsync('auth_token');
  };
  if (!roomUrl) return null;
  useEffect(() => {
    const requestMic = async () => {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.MICROPHONE
          : PERMISSIONS.ANDROID.RECORD_AUDIO;

      const result = await request(permission);
      if (result !== RESULTS.GRANTED) {
        alert('Microphone permission is required for voice calls.');
      }
    };

    requestMic();
  }, []);
  const endCall = async (channelName: string) => {
    try {
      const token = await getToken(); // Get user auth token

      const response = await fetch('https://gympaddy.hmstech.xyz/api/user/end-daily-call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel_name: channelName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to end call');
      }

      console.log('Call ended successfully');
      return true;

    } catch (err) {
      console.error('End call error:', err);
      Alert.alert('End Call Error', err.message || 'Unknown error');
      return false;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {loading && (
        <ActivityIndicator
          size="large"
          color="#FF3B30"
          style={styles.loading}
        />
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: callUrl }}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={true}
        onPermissionRequest={(event) => {
          event.grant(event.resources);
        }}
      />
      <TouchableOpacity
        onPress={async () => {
          webViewRef.current?.postMessage(JSON.stringify({ action: 'leave-call' }));

          const success = await endCall(channelName); // Pass it from route params
          if (success) {
            setTimeout(() => router.back(), 1000); // Give time to leave Agora
          }
        }}

        style={styles.closeBtn}
      >
        <Text style={styles.closeText}>End Call</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -18,
    zIndex: 99,
  },
  closeBtn: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    padding: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    zIndex: 999,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';
export default function DailyCallScreen() {
  const { roomUrl, type, callType, channelName } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const webViewRef = React.useRef(null);
console.log("calltype",callType,"channnel name",channelName,"type",type)
  // Use custom hosted voice-only HTML page
  // Define the URL based on call type
  const callUrl =
    callType === 'voice'
      ? `https://hmstech.xyz/agora.html?role=${type}&room=${channelName}`
      : roomUrl

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
  onPress={() => {
    webViewRef.current?.postMessage(JSON.stringify({ action: 'leave-call' }));
    setTimeout(() => router.back(), 1000); // give the WebView 1s to leave
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

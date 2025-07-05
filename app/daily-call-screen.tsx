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
  const { roomUrl, type, callType } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Use custom hosted voice-only HTML page
  // Define the URL based on call type
  const callUrl =
    callType === 'voice'
      ? `https://hmstech.xyz/agora.html?role=caller`
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
        source={{ uri: callUrl }}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={true}
        // VERY IMPORTANT:
        // This enables mic/cam permissions in Android WebView
        onPermissionRequest={(event) => {
          event.grant(event.resources);
        }}
      />

      <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
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

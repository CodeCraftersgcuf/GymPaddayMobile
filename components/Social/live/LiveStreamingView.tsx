import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { getLiveVideoCallToken } from '@/utils/mutations/video';
import * as SecureStore from 'expo-secure-store';
import LiveStreamingPlayer from './LiveStreamingPlayer';

interface LiveStreamingViewProps {
  dark: boolean;
  onEndLive: () => void;
  onThreeDotsPress: () => void;
}

export default function LiveStreamingView({
  dark,
  onEndLive,
  onThreeDotsPress,
}: LiveStreamingViewProps) {
  const UID = 12345;
  const CHANNEL_NAME = 'live_stream';

  const fetchLiveVideoCallToken = useMutation({
    mutationFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      return await getLiveVideoCallToken(
        { channel_name: CHANNEL_NAME, uid: UID, role: 'host' },
        token
      );
    },
    onSuccess: (data) => {
      console.log('✅ Live token fetched:', data);
    },
    onError: (error) => {
      console.error('❌ Live token error:', error);
    },
  });

  // Permissions for Android
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        const allGranted = Object.values(granted).every(
          (result) => result === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          alert('Camera & Microphone permissions are required.');
        }
      }
    };

    requestPermissions();
  }, []);

  // Fetch token on mount
  useEffect(() => {
    fetchLiveVideoCallToken.mutate();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: dark ? '#000' : '#FFF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <MaterialIcons name="arrow-back" size={24} color={dark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: dark ? '#FFF' : '#000' }]}>Live Streaming</Text>
        <View style={{ width: 24 }} /> {/* Spacer to balance layout */}
      </View>

      {/* Stream View */}
      <View style={styles.streamContainer}>
        {fetchLiveVideoCallToken.isPending && (
          <ActivityIndicator size="large" color="#FF0000" />
        )}

        {fetchLiveVideoCallToken.data && (
          <LiveStreamingPlayer
            token={fetchLiveVideoCallToken.data.token}
            channelName={CHANNEL_NAME}
            uid={UID}
            role="host"
          />
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.endLiveButton} onPress={onEndLive}>
          <Text style={styles.endLiveButtonText}>End Live</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewAudienceButton}>
          <Text
            style={[
              styles.viewAudienceButtonText,
              { color: dark ? '#FFF' : '#000' },
            ]}
          >
            View Audience
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  streamContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'black',
  },
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 15,
  },
  endLiveButton: {
    flex: 1,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  endLiveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewAudienceButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  viewAudienceButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

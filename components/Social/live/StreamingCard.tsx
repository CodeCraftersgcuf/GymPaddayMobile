import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';
import { apiCall } from '@/utils/customApiCall';
import { API_ENDPOINTS } from '@/apiConfig';

interface StreamingCardProps {
  dark: boolean;
  selectedDuration: string;
  onDurationSelect: () => void;
  onGoLive: () => void;
  onBuyMinutes: () => void;
}

export default function StreamingCard({
  dark,
  selectedDuration,
  onDurationSelect,
  onGoLive,
  onBuyMinutes,
}: StreamingCardProps) {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [liveMinutes, setLiveMinutes] = useState<number | null>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [authUserId, setAuthUserId] = useState<number | null>(null);
  const MAX_MINUTES = 720;
  const MIN_FOLLOWERS = 500;
  const hasMinFollowers =
    followerCount !== null && followerCount >= MIN_FOLLOWERS;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    const loadProfileFollowers = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return;

        const cached = await SecureStore.getItemAsync('user_data');
        if (cached) {
          const u = JSON.parse(cached) as { id?: number; followers_count?: number };
          if (typeof u.id === 'number') setAuthUserId(u.id);
          if (typeof u.followers_count === 'number') setFollowerCount(u.followers_count);
        }

        const data = (await apiCall(API_ENDPOINTS.USER.PROFILE.Me, 'GET', undefined, token)) as {
          user?: { id?: number };
          followers_count?: number;
        };
        const user = data?.user;
        if (user && typeof user.id === 'number') setAuthUserId(user.id);
        if (typeof data?.followers_count === 'number') {
          setFollowerCount(data.followers_count);
        }
      } catch (err) {
        console.error('Error loading profile for live gate:', err);
      }
    };

    loadProfileFollowers();
  }, []);

  useEffect(() => {
    const fetchLiveMinutes = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return;

        const res = await fetch('https://gympaddy.skillverse.com.pk/api/user/minutes', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (!res.ok) throw new Error('Failed to fetch minutes');

        const data = await res.json();
        setLiveMinutes(data?.data?.live_stream_minute ?? 0);
      } catch (err) {
        console.error('❌ Error fetching minutes:', err);
      }
    };

    fetchLiveMinutes();
  }, []);

  if (!permission) return <Text>Requesting permission...</Text>;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.buyButton}>
          <Text style={{ color: '#940304', fontWeight: 'bold' }}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }
const canGoLive = hasMinFollowers && liveMinutes !== null && liveMinutes > 0;

  return (
    <View style={styles.container}>
      {/* Camera Preview */}
      <View style={styles.cameraContainer}>
        <CameraView style={styles.cameraPreview} facing={facing} />
        <TouchableOpacity
          style={styles.flipCamera}
          activeOpacity={0.85}
          onPress={() =>
            setFacing((prev) => (prev === 'back' ? 'front' : 'back'))
          }
        >
          <MaterialIcons name="flip-camera-ios" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Streaming Info Card */}
      <LinearGradient
        colors={['#940304', '#8B00FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.infoCard}
      >
        <Text style={styles.durationText}>Enjoy Live Streaming </Text>
        {/* <Text style={styles.hoursText}>
          {liveMinutes !== null ? `${(liveMinutes / 60).toFixed(1)} Hrs` : 'Loading...'}
        </Text> */}

        {/* <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width:
                  liveMinutes !== null
                    ? `${Math.min((liveMinutes / MAX_MINUTES) * 100, 100)}%`
                    : '0%',
              },
            ]}
          />
        </View> */}

        <Text style={styles.purchaseText}>
          {followerCount === null
            ? 'Loading follower count…'
            : `You need ${MIN_FOLLOWERS} followers to go live (${followerCount} / ${MIN_FOLLOWERS}).`}
        </Text>
        <Text style={styles.hintText}>
          Grow faster: invite friends, share your profile from the menu, post regularly, and engage with others
          so people follow you back.
        </Text>

        {/* <View style={styles.priceContainer}>
          <Text style={styles.priceText}>30GP / 30 Minutes</Text>
          <TouchableOpacity style={styles.buyButton} onPress={onBuyMinutes}>
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View> */}
      </LinearGradient>

      {/* Error Message */}
      {!hasMinFollowers && followerCount !== null && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            You need at least {MIN_FOLLOWERS} followers to go live. Open your profile to share your link and invite
            friends.
          </Text>
          {authUserId != null && (
            <TouchableOpacity
              style={styles.profileLink}
              onPress={() =>
                router.push({ pathname: '/UserProfile', params: { user_id: String(authUserId) } })
              }
            >
              <Text style={styles.profileLinkText}>Open my profile</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Duration Selector */}
      <TouchableOpacity
        style={[
          styles.durationSelector,
          { backgroundColor: dark ? '#181818' : '#F5F5F5' },
        ]}
        onPress={onDurationSelect}
      >
        <Text
          style={[
            styles.durationSelectorText,
            { color: dark ? '#FFFFFF' : '#666666' },
          ]}
        >
          {selectedDuration ?? 'Select Duration'}
        </Text>
        <MaterialIcons
          name="keyboard-arrow-down"
          size={24}
          color={dark ? '#FFFFFF' : '#666666'}
        />
      </TouchableOpacity>

      {/* Go Live Button */}
      <TouchableOpacity
        style={[
          styles.goLiveButton,
          {
            backgroundColor: canGoLive ? '#940304' : '#CCCCCC',
            opacity: canGoLive ? 1 : 0.6,
          },
        ]}
        onPress={onGoLive}
        disabled={!canGoLive}
      >
        <Text style={styles.goLiveButtonText}>Go Live</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cameraContainer: {
    marginBottom: 20,
  },
  cameraPreview: {
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
  },
  flipCamera: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 5,
  },
  hoursText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  purchaseText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 8,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.85,
    lineHeight: 19,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buyButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buyButtonText: {
    color: '#940304',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF9999',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    color: '#CC0000',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
  },
  profileLink: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  profileLinkText: {
    color: '#940304',
    fontWeight: '600',
    fontSize: 15,
  },
  durationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  durationSelectorText: {
    fontSize: 16,
  },
  goLiveButton: {
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  goLiveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

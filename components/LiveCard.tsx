import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_PROFILE_IMAGE } from '@/constants/profilePlaceholder';
import { LIVE_STREAM_API_BASE } from '@/utils/liveStreamConstants';

const { width, height } = Dimensions.get('window');

interface Props {
  postImageUrl?: string | null;
  profilePictureUrl?: string | null;
  title: string;
  userName: string;
  viewers?: number;
  timeAgo?: string;
  channelName: string;
  id?: string;
}

const LiveCard: React.FC<Props> = ({
  postImageUrl,
  profilePictureUrl,
  id,
  title,
  userName,
  viewers = 20,
  timeAgo = 'Offline',
  channelName,
}) => {
  const router = useRouter();

  const handlePress = async () => {
    if (timeAgo !== 'Live now') return;
    if (!channelName || !id) return;

    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');

      const res = await fetch(`${LIVE_STREAM_API_BASE}/live-streams/${id}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        let message = 'Unable to join this stream.';
        try {
          const errorData = await res.json();
          if (typeof errorData?.message === 'string') message = errorData.message;
        } catch {
          /* ignore */
        }
        Alert.alert('Live stream', message);
        return;
      }

      router.push({
        pathname: '/userLiveViewMain',
        params: { channelName, id: String(id) },
      });
    } catch (err) {
      console.error('Join live stream failed:', err);
      Alert.alert('Live stream', 'Could not join. Check your connection and try again.');
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <View style={styles.card}>
        <Image
          source={postImageUrl ? { uri: postImageUrl } : DEFAULT_PROFILE_IMAGE}
          style={styles.image}
        />
        <View style={styles.overlay}>
          <Image
            source={profilePictureUrl ? { uri: profilePictureUrl } : DEFAULT_PROFILE_IMAGE}
            style={styles.avatar}
          />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.name}>{userName}</Text>
            <Text style={styles.meta}>{viewers} Viewers</Text>
          </View>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width-20,
    height: height *0.9, // take 60% of screen height
    marginBottom: 16,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00000088',
    borderRadius: 12,
    padding: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  meta: {
    color: '#ccc',
    fontSize: 13,
  },
  time: {
    color: '#ccc',
    marginLeft: 'auto',
    fontSize: 12,
  },
});

export default LiveCard;

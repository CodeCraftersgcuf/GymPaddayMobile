import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

interface Props {
  postImageUrl: string;
  profilePictureUrl: string;
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
  timeAgo = 'Live now',
  channelName,
}) => {
  const router = useRouter();

  const handlePress = async () => {
    if (!channelName || !id) return;

    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token');

      const res = await fetch(`https://gympaddy.hmstech.xyz/api/user/live-streams/${id}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Join error:', errorData);
        return;
      }

      router.push({
        pathname: '/userLiveViewMain',
        params: { channelName, id },
      });
    } catch (err) {
      console.error('Join live stream failed:', err);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <View style={styles.card}>
        <Image source={{ uri: postImageUrl }} style={styles.image} />
        <View style={styles.overlay}>
          <Image source={{ uri: profilePictureUrl }} style={styles.avatar} />
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
    resizeMode: 'contain',
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

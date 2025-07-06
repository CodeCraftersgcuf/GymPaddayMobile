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

const { width } = Dimensions.get('window');
const cardWidth = (width - 40) / 2;

interface Props {
  profileUrl: string;
  title: string;
  userName: string;
  viewers?: number;
  timeAgo?: string;
  channelName: string; // required now
  id?: string;
}

const LiveCard: React.FC<Props> = ({
  profileUrl,
  id,
  title,
  userName,
  viewers = 20,
  timeAgo = '1hr ago',
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
    console.log("response is ",res)
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Join error:', errorData);
      return;
    }

    // ✅ Proceed to live screen after join success
    router.push({
      pathname: '/userLiveViewMain',
      params: { channelName, id },
    });
  } catch (err) {
    console.error('Join live stream failed:', err);
  }
};

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.card}>
        <Image source={{ uri: profileUrl }} style={styles.image} />
        <View style={styles.overlay}>
          <Image source={{ uri: profileUrl }} style={styles.avatar} />
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
    width: cardWidth,
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'red',
  },
  image: {
    width: '100%',
    height: cardWidth * 1.3,
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00000070',
    borderRadius: 10,
    padding: 6,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
  },
  meta: {
    color: '#ccc',
    fontSize: 12,
  },
  time: {
    color: '#ccc',
    marginLeft: 'auto',
    fontSize: 10,
  },
});

export default LiveCard;

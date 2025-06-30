import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';


//Code related to the integration
import { useMutation } from '@tanstack/react-query';
import { getLiveVideoCallToken } from '@/utils/mutations/video';
import * as SecureStore from 'expo-secure-store';

import LiveStreamingPlayer from './LiveStreamingPlayer';

interface LiveStreamingViewProps {
  dark: boolean;
  onEndLive: () => void;
  onThreeDotsPress: () => void;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  avatar: string;
  isGift?: boolean;
  giftCount?: number;
}

export default function LiveStreamingView({ dark, onEndLive, onThreeDotsPress }: LiveStreamingViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user: 'Amara',
      message: 'This is a beautiful scenery',
      avatar: '👨‍💼',
    },
    {
      id: '2',
      user: 'Sandra',
      message: 'This is a beautiful scenery',
      avatar: '👨‍💻',
    },
    {
      id: '3',
      user: 'Adewale',
      message: 'This is a beautiful scenery',
      avatar: '👨‍🦲',
    },
    {
      id: '4',
      user: 'Samantha',
      message: 'Sent you a gift',
      avatar: '👩‍🦰',
      isGift: true,
      giftCount: 3,
    },
  ]);

  const fetchLiveVideoCallToken = useMutation({
    mutationFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      return await getLiveVideoCallToken({ channel_name: 'live_stream', uid: 12345, role: 'host' }, token);
    },
    onSuccess: (data) => {
      console.log('Live video call token fetched successfully:', data);
    },
    onError: (error) => {
      console.error('Error fetching live video call token:', error);
    },
  });

  useEffect(() => {
    // Simulate new messages coming in
    const interval = setInterval(() => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        user: 'Viewer' + Math.floor(Math.random() * 100),
        message: 'Amazing stream!',
        avatar: '👤',
      };
      setMessages(prev => [...prev, newMessage].slice(-10)); // Keep only last 10 messages
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchLiveVideoCallToken.mutate();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: dark ? '#000000' : '#FFFFFF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={dark ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>

        <Text style={[styles.title, { color: dark ? '#FFFFFF' : '#000000' }]}>
          Live Streaming
        </Text>

        {/* <TouchableOpacity onPress={onThreeDotsPress}>
          <MaterialIcons 
            name="more-vert" 
            size={24} 
            color={dark ? '#FFFFFF' : '#000000'} 
          />
        </TouchableOpacity> */}
      </View>

      {/* Live Stream View */}
      <View style={styles.streamContainer}>
        <View style={styles.streamContainer}>
          {fetchLiveVideoCallToken.isPending && (
            <ActivityIndicator size="large" color="#FF0000" />
          )}

          {fetchLiveVideoCallToken.data && (
            <LiveStreamingPlayer
              token={fetchLiveVideoCallToken.data.token}
              channelName="live_stream"
              uid={12345}
              role="host"
            />
          )}
        </View>

      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.endLiveButton} onPress={onEndLive}>
          <Text style={styles.endLiveButtonText}>End Live</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.viewAudienceButton}>
          <Text style={[styles.viewAudienceButtonText, { color: dark ? '#FFFFFF' : '#000000' }]}>
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
    // paddingTop: 50,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    position: 'absolute',
    left: "50%",
    transform: [{ translateX: -30 }],
    fontSize: 18,
    fontWeight: '600',
  },
  streamContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  streamView: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  streamImage: {
    borderRadius: 20,
  },
  flipCamera: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  chatContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    maxHeight: 200,
  },
  chatScroll: {
    flex: 1,
  },
  chatMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: 10,
  },
  chatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
  },
  chatContent: {
    flex: 1,
  },
  chatUser: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatText: {
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
  },
  giftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  giftIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  giftBadge: {
    backgroundColor: '#FF0000',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  giftCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
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
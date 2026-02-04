import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Image,
  ScrollView,
  BackHandler
} from 'react-native';
import Modal from 'react-native-modal';

import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getLiveVideoCallToken } from '@/utils/mutations/video';
import * as SecureStore from 'expo-secure-store';
import LiveStreamingPlayer from './LiveStreamingPlayer';
import WebView from 'react-native-webview';
import { useLiveStreamChats } from '@/utils/hooks/useLiveStreamChats';
import { useSendLiveStreamMessage } from '@/utils/hooks/useSendLiveStreamMessage';
import { Alert } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';

interface LiveStreamingViewProps {
  dark: boolean;
  onEndLive: () => void;
  onThreeDotsPress: () => void;
  channelName: string
  livestreamId?: string
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  avatar: string;
  hasGift?: boolean;
  giftCount?: number;
}
export default function LiveStreamingView({
  dark,
  onEndLive,
  onThreeDotsPress,
  channelName,
  livestreamId
}: LiveStreamingViewProps) {
  const UID = 12345;
  const CHANNEL_NAME = channelName ?? 'live_stream';
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([

  ]);
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
      // console.log('✅ Live token fetched:', data);
    },
    onError: (error) => {
      console.error('❌ Live token error:', error);
    },
  });


  const [audienceModalVisible, setAudienceModalVisible] = useState(false);
  const { data: chats = [], isLoading } = useLiveStreamChats(livestreamId);
  const { mutate: sendChatMessage, isPending } = useSendLiveStreamMessage(livestreamId);
  // console.log("chats", chats)
  useEffect(() => {
    if (chats.length > 0) {
      let giftTotal = 0;

      const formatted = chats.map((msg: any) => {
        if (msg.type === 'gift') {
          giftTotal += 1;
        }

        return {
          id: msg.id.toString(),
          user: msg.user?.fullname || 'User',
          message: msg.message,
          avatar: msg.user?.profile_picture_url || 'https://ui-avatars.com/api/?name=User',
          hasGift: msg.type === 'gift',
          giftCount: msg.amount,

          // ✅ Add reply_to data (if exists)
          reply_to: msg.reply_to
            ? {
              id: msg.reply_to.id,
              message: msg.reply_to.message,
              user: {
                fullname: msg.reply_to.user?.fullname || 'User',
              },
            }
            : null,
        };
      });

      setChatMessages(formatted);
      setTotalGifts(giftTotal);
    }
  }, [chats]);


  const audienceQuery = useQuery({
    queryKey: ['audience', livestreamId],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      const res = await fetch(`https://gympaddy.skillverse.com.pk/api/user/live-streams/${livestreamId}/audience`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch audience');
      return await res.json();
    },
    enabled: audienceModalVisible, // only fetch when modal is open
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
  useEffect(() => {
    fetchLiveVideoCallToken.mutate();
  }, []);
  useEffect(() => {
    if (audienceQuery.data) {
      // console.log('Audience API response:', audienceQuery.data);
    }
  }, [audienceQuery.data]);
  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        'End Live Stream?',
        'Please end the live stream before leaving.',
        [{ text: 'OK', style: 'cancel' }]
      );
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => subscription.remove(); // cleanup
  }, []);

  //adding new features
  const [duration, setDuration] = useState(0);
  const [audienceCount, setAudienceCount] = useState(0);
  const [totalGifts, setTotalGifts] = useState(0);
  const [insightsModalVisible, setInsightsModalVisible] = useState(false);


  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        const res = await fetch(`https://gympaddy.skillverse.com.pk/api/user/live-streams/${livestreamId}/audience-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        console.log("testing audiance count", data)
        if (res.ok) setAudienceCount(data.count || 0);
      } catch (err) {
        console.log("🔴 Error fetching audience count", err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [livestreamId]);

  //adding new feature reply to user chaty
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  // const canType = currentUserRole === 'host' || currentUserRole === 'admin';

  const canType = true;

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
      <View style={styles.streamContainer}>
        {fetchLiveVideoCallToken.isPending && (
          <ActivityIndicator size="large" color="#940304" />
        )}

        {fetchLiveVideoCallToken.data && (
          <WebView
            source={{
              uri: `https://hmstech.xyz/live.html?channel=${CHANNEL_NAME}&role=host`,
            }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
            style={{ flex: 1 }}
            onMessage={(event) => {
              const message = event.nativeEvent.data;
              console.log("📩 Message from WebView:", message);

              if (message === "stream_ended") {
                // Call your handler to exit the live view
                onEndLive(); // 👈 this should navigate away or close the screen
              }
            }}
          />
        )}

        <View style={styles.chatOverlay}>
          <ScrollView style={styles.chatContainer} showsVerticalScrollIndicator={false}>
            {chatMessages.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                onLongPress={() => {
                  setReplyTo(chat);
                  setReplyText('');
                  setReplyModalVisible(true);
                }}
              >
                <View style={styles.chatMessage}>
                  <Image source={{ uri: chat.avatar }} style={styles.avatar} />
                  <View style={[styles.messageContainer, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <Text style={styles.username}>{chat.user}</Text>

                    {/* Reply Preview Box */}
                    {chat.reply_to && (
                      <View style={styles.replyPreview}>
                        <Text style={styles.replyUserText}>
                          Replying to {chat.reply_to.user?.fullname || 'User'}
                        </Text>
                        <Text style={styles.replyMessageText} numberOfLines={1}>
                          {chat.reply_to.message}
                        </Text>
                      </View>
                    )}

                    <View style={styles.messageRow}>
                      <Text style={styles.messageText}>{chat.message}</Text>

                      {chat.hasGift && (
                        <View style={styles.giftContainer}>
                          <Text style={styles.giftEmoji}>🎁</Text>
                          <View style={styles.giftBadge}>
                            <Text style={styles.giftCount}>x{chat.giftCount}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

          </ScrollView>
        </View>

        {canType && (
          <View style={styles.inputBar}>
            {!!replyTo && (
              <TouchableOpacity style={styles.inputReplyChip} onPress={() => setReplyTo(null)}>
                <Text style={styles.inputReplyChipText}>
                  Replying to {replyTo.user}: {replyTo.message?.slice(0, 32)}{replyTo.message?.length > 32 ? '…' : ''}
                </Text>
                <Text style={styles.inputReplyChipClose}>✕</Text>
              </TouchableOpacity>
            )}

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={replyTo ? 'Write a reply…' : 'Write a message…'}
                placeholderTextColor="#9AA0A6"
                value={messageText}
                onChangeText={setMessageText}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, isPending && { opacity: 0.6 }]}
                disabled={isPending || !messageText.trim()}
                onPress={() => {
                  const text = messageText.trim();
                  if (!text) return;

                  // optimistic UI (optional)
                  const optimisticId = `temp-${Date.now()}`;
                  setChatMessages(prev => [
                    ...prev,
                    {
                      id: optimisticId,
                      user: 'You',
                      message: text,
                      avatar: 'https://ui-avatars.com/api/?name=You',
                      hasGift: false,
                      giftCount: 0,
                      // show the reply preview quickly
                      reply_to: replyTo
                        ? {
                          id: replyTo.id,
                          message: replyTo.message,
                          user: { fullname: replyTo.user },
                        }
                        : null,
                    } as any,
                  ]);

                  sendChatMessage(
                    { message: text, reply_to: replyTo?.id },
                    {
                      onSuccess: () => {
                        // clear the draft + reply target
                        setMessageText('');
                        setReplyTo(null);
                      },
                      onError: (e: any) => {
                        // rollback optimistic item
                        setChatMessages(prev => prev.filter(m => m.id !== optimisticId));
                        Alert.alert('Failed to send', e?.message ?? 'Please try again.');
                      },
                    }
                  );
                }}
              >
                <MaterialIcons name="send" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* <TouchableOpacity style={styles.endLiveButton} onPress={onEndLive}>
          <Text style={styles.endLiveButtonText}>End Live</Text>
        </TouchableOpacity> */}
        <TouchableOpacity
          style={styles.viewAudienceButton}
          onPress={() => setAudienceModalVisible(true)} // ✅ show modal
        >
          <Text
            style={[
              styles.viewAudienceButtonText,
              { color: dark ? '#FFF' : '#000' },
            ]}
          >
            View Audience
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.viewAudienceButton}
          onPress={() => setInsightsModalVisible(true)}
        >
          <Text
            style={[
              styles.viewAudienceButtonText,
              { color: dark ? '#FFF' : '#000' },
            ]}
          >
            View Insights
          </Text>
        </TouchableOpacity>


      </View>
      <Modal
        isVisible={audienceModalVisible}
        onBackdropPress={() => setAudienceModalVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Current Audience</Text>

          {audienceQuery.isLoading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : Array.isArray(audienceQuery.data?.data) && audienceQuery.data.data.length > 0 ? (
            audienceQuery.data.data.map((audience: any) => (
              <View
                key={audience.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#eee',
                  gap: 12,
                }}
              >
                <Image
                  source={{
                    uri: audience.user?.profile_picture
                      ? audience.user.profile_picture.includes('http')
                        ? audience.user.profile_picture
                        : `${audience.user.profile_picture}`
                      : 'https://yourdomain.com/default-avatar.png',
                  }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
                <View>
                  <Text style={{ fontWeight: '600' }}>{audience.user?.fullname || 'Unnamed User'}</Text>
                  {/* <Text style={{ color: '#555' }}>{audience.user?.email || 'No email'}</Text> */}
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: '#888', textAlign: 'center', paddingVertical: 20 }}>
              No audience found.
            </Text>
          )}

        </View>
      </Modal>
      <Modal
        isVisible={insightsModalVisible}
        onBackdropPress={() => setInsightsModalVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#fff',
            padding: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '90%',
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
            📊 Live Stream Insights
          </Text>

          {/* Stats Section */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              rowGap: 16,
              columnGap: 12,
              marginBottom: 20,
            }}
          >
            {[
              { label: '👁️ Viewers', value: audienceCount },
              { label: '⏱️ Duration', value: formatDuration(duration) },
              { label: '🎁 Total Gifts', value: totalGifts },
              { label: '🪙 GP Coins', value: totalGifts * 10 },
              { label: '💬 Comments', value: chatMessages.length },
            ].map((item, idx) => (
              <View
                key={idx}
                style={{
                  width: '48%',
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: '#f9f9f9',
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Text style={{ fontSize: 14, color: '#555' }}>{item.label}</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Audience List */}
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            🧑‍🤝‍🧑 Audience Members
          </Text>

          {audienceQuery.isLoading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : Array.isArray(audienceQuery.data?.data) &&
            audienceQuery.data.data.length > 0 ? (
            <ScrollView style={{ maxHeight: 300 }}>
              {audienceQuery.data.data.map((audience: any) => (
                <View
                  key={audience.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    backgroundColor: '#f2f2f2',
                    marginBottom: 10,
                    borderRadius: 10,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                    gap: 12,
                  }}
                >
                  <Image
                    source={{
                      uri: audience.user?.profile_picture
                        ? audience.user.profile_picture.includes('http')
                          ? audience.user.profile_picture
                          : `${audience.user.profile_picture}`
                        : 'https://yourdomain.com/default-avatar.png',
                    }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                  />
                  <View>
                    <Text style={{ fontWeight: '600', fontSize: 16 }}>
                      {audience.user?.fullname || 'Unnamed User'}
                    </Text>
                    <Text style={{ color: '#666', fontSize: 13 }}>
                      {audience.user?.email || 'No email'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text
              style={{
                color: '#888',
                textAlign: 'center',
                paddingVertical: 20,
                fontStyle: 'italic',
              }}
            >
              No audience found.
            </Text>
          )}
        </View>
      </Modal>

      {/*  chat reply mopdal */}
      <Modal
        isVisible={replyModalVisible}
        onBackdropPress={() => setReplyModalVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Reply to {replyTo?.user}</Text>
          <Text style={{ marginBottom: 10, color: '#555' }}>{replyTo?.message}</Text>

          <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 10 }}>
            <TextInput
              placeholder="Type your reply..."
              value={replyText}
              onChangeText={setReplyText}
              multiline
              style={{ height: 80, textAlignVertical: 'top' }}
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              if (replyText.trim()) {
                sendChatMessage({ message: replyText, reply_to: replyTo?.id }); // Optional: include reply ID
                setReplyModalVisible(false);
                setReplyTo(null);
                setReplyText('');
              } else {
                Alert.alert('Error', 'Please type a message before sending.');
              }
            }}
            style={{
              backgroundColor: '#007AFF',
              padding: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send Reply</Text>
          </TouchableOpacity>
        </View>
      </Modal>



    </View>
  );
}

const styles = StyleSheet.create({
  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#0E0E0E',
  },
  inputReplyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  inputReplyChipText: { color: '#D7D7D7', flex: 1, fontSize: 12 },
  inputReplyChipClose: { color: '#BBB', marginLeft: 8, fontSize: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    color: '#fff',
    borderRadius: 10,
  },
  sendBtn: {
    height: 42,
    minWidth: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
  },

  chatOverlay: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    maxHeight: 200,
  },
  chatContainer: {
    flex: 1,
  },
  chatMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContainer: {
    flex: 1,
    padding: 8,
    borderRadius: 12,
  },
  username: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
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
    marginTop: 10
  },
  endLiveButton: {
    flex: 1,
    backgroundColor: '#940304',
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
  giftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftEmoji: {
    fontSize: 20,
    marginRight: 4,
  },
  giftBadge: {
    backgroundColor: '#940304',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  giftCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  replyBox: {
    backgroundColor: '#222',
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 10,
  },
  replyUser: {
    color: '#bbb',
    fontSize: 12,
  },
  replyContent: {
    color: '#eee',
    fontSize: 14,
    fontWeight: 'bold',
  },
  replyPreview: {
    backgroundColor: '#333',
    padding: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  replyUserText: {
    fontSize: 11,
    color: '#aaa',
  },
  replyMessageText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },

});

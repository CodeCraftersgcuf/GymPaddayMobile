import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from "@/contexts/themeContext";
import { useQuery, useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from "expo-router";
import { fetchChatMessages } from '@/utils/queries/chat';
import { sendChatMessage } from '@/utils/mutations/chat';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons as Icon, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { images } from '@/constants';
import { useAgoraCall } from './AgoraCallScreen';

import AgoraVideoView from 'react-native-agora';

import { RenderModeType } from 'react-native-agora';
import VoiceCallScreenT from '@/app/VoiceCallScreen';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
import { RtcSurfaceView } from 'react-native-agora';

export default function MessageChat() {
  const { dark } = useTheme();
  const { conversation_id, user_id, user_pic, user_name } = useLocalSearchParams();
  const [newMessage, setNewMessage] = useState('');
  const [showVideoCallPopup, setShowVideoCallPopup] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList<any>>(null);
  const router = useRouter();
  const [callerUid, setCallerUid] = useState<number | null>(null);
  const theme = {
    background: dark ? '#000000' : '#ffffff',
    secondary: dark ? '#181818' : '#f5f5f5',
    text: dark ? '#ffffff' : '#000000',
    textSecondary: dark ? '#999999' : '#666666',
    border: dark ? '#333333' : '#e0e0e0',
  };
  const getToken = async () => {
    return await SecureStore.getItemAsync('auth_token');
  };
  const getUserData = async () => {
    return await SecureStore.getItemAsync('user_data');
    console.log("User data:", user_id);
  };
  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['chatMessages', conversation_id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token found');
      return fetchChatMessages(token, conversation_id);
    },
    enabled: !!conversation_id,
  });
  const [lastCallId, setLastCallId] = useState<number | null>(null);

  const [incomingCall, setIncomingCall] = useState<null | {
    id: number;

    channel_name: string;
    type: 'Voice' | 'video';
    receiver_id: number;
    caller_id: number;
    receiver_uid: number;
    caller_uid?: number;
  }>(null);
  const firstMessage = data?.messages?.[0];

  const senderImage = firstMessage?.sender?.profile_picture_url || '';
  const receiverImage = firstMessage?.receiver?.profile_picture_url || '';
  const receiverName = firstMessage?.receiver?.fullname || 'User';
  const [receiverUid, setReceiverUid] = useState<number | null>(null);

  const messages = data?.messages?.map((msg: any) => {
    let imageUrl = msg.image_url || msg.imagePath || msg.image || null;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `https://gympaddy.hmstech.xyz/storage/${imageUrl}`;
    }
    return {
      id: String(msg.id),
      isCurrentUser: msg.direction === 'sent',
      text: msg.message,
      timestamp: new Date(msg.created_at),
      senderPicture: msg.direction === 'sent'
        ? msg.sender?.profile_picture_url
        : msg.receiver?.profile_picture_url,
      image: imageUrl,
    }
  }) || [];


  const sendMessageMutation = useMutation({
    mutationFn: async (payload: { text: string; imageUri?: string | null }) => {
      const token = await getToken();
      if (!token) throw new Error('No token found');
      if (payload.imageUri) {
        const formData = new FormData();
        formData.append('sender_id', 'current');
        formData.append('receiver_id', user_id);
        formData.append('conversation_id', conversation_id);
        if (payload.text) formData.append('message', payload.text);
        // Use field name 'image' (not 'image[]') and ensure correct file object
        const fileObj = {
          uri: payload.imageUri,
          name: `chat_${Date.now()}.jpg`,
          type: 'image/jpeg',
        } as any;
        formData.append('image', fileObj);

        // Debug: log FormData keys and values
        if (__DEV__) {
          // Only works in dev, not in production
          // FormData can't be directly logged, so we use a workaround
          // @ts-ignore
          formData._parts?.forEach?.(([key, value]) => {
            if (typeof value === 'object' && value.uri) {
              console.log('FormData:', key, value.uri, value.name, value.type);
            } else {
              console.log('FormData:', key, value);
            }
          });
        }
        console.log('Sending message with image:', payload.text, payload.imageUri);
        const response = await fetch('https://gympaddy.hmstech.xyz/api/user/chat-messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: formData,
        });
        const resJson = await response.json();
        console.log('Image message response:', resJson);
        if (!response.ok) {
          throw new Error(resJson?.message || 'Failed to send image message');
        }
        return resJson;
      } else {
        // Text only
        console.log('Sending text message:', payload.text);
        return sendChatMessage(
          { sender_id: 'current', receiver_id: user_id, message: payload.text, conversation_id: conversation_id },
          token
        );
      }
    },
    onSuccess: () => {
      setNewMessage('');
      setAttachedImage(null);
      refetch();
    },
    onError: (err) => {
      console.log('Send message error:', err);
    }
  });
  const handleSendMessage = () => {
    if ((newMessage.trim() || attachedImage) && !sendMessageMutation.isLoading) {
      sendMessageMutation.mutate({ text: newMessage.trim(), imageUri: attachedImage });
    }
  };
  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  }, [messages.length]);
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');

        const res = await fetch('https://gympaddy.hmstech.xyz/api/user/user/incoming-daily-call', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { call } = await res.json();
        // console.log('Incoming call:', call);

        if (
          call &&
          call.channel_name &&
          call.status?.toLowerCase() === 'initiated' &&
          call.id !== lastCallId
        ) {
          setLastCallId(call.id);
          console.log('New incoming call detected');

          // Navigate to DailyCallScreen as receiver
          router.push({
            pathname: '/daily-call-screen',
            params: {
              roomUrl: call.room_url,
              type: 'receiver',
              callType: call.type,
              channelName: call.channel_name
            },
          });
        }
      } catch (error) {
        console.log('Incoming call check failed:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [lastCallId]);
  const handleVideoCall = async () => {
    try {
      const receiverId = user_id; // Make sure this is defined
      const token = await SecureStore.getItemAsync('auth_token');

      if (!token) throw new Error('Authentication token not found');
      console.log("hanndled video clicked")
      router.push({
        pathname: '/StreamCallInitiateScreen',
        params: {
          receiver_id: receiverId,
          call_type: 'video',
          receiver_avatar: otherUser?.profile_picture_url,
          receiver_name: otherUser?.fullname ?? otherUser?.username
        },
      });

    } catch (err: any) {
      console.error('Video call error:', err);
      Alert.alert('Call Error', err.message || 'Unknown error');
    }

  };
  const [channelName, setChannelName] = useState('');
  const handleVoiceCall = async () => {
    try {
      const receiverId = user_id; // Make sure this is defined
      const token = await SecureStore.getItemAsync('auth_token');

      if (!token) throw new Error('Authentication token not found');
      console.log("handle voice clicked");

      router.push({
        pathname: '/StreamCallInitiateScreen',
        params: {
          receiver_id: receiverId,
          call_type: 'voice', // or 'voice', depending on your backend naming
          receiver_avatar: otherUser?.profile_picture_url,
          receiver_name: otherUser?.fullname ?? otherUser?.username
        },
      });

    } catch (err: any) {
      console.error('Voice call error:', err);
      Alert.alert('Call Error', err.message || 'Unknown error');
    }
  };

  const hanldeViewProfile = (id: any) => {
    router.push({
      pathname: '/UserProfile',
      params: { user_id: user_id },
    })
  }

  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.isCurrentUser;
    const showAvatar =
      !isCurrentUser &&
      (index === 0 || messages[index - 1].senderId !== item.senderId);

    return (
      <View
        style={[
          styles.messageBubble,
          { justifyContent: isCurrentUser ? 'flex-end' : 'flex-start' },
        ]}
      >
        {/* Avatar only for received messages */}
        {!isCurrentUser && showAvatar && (
          <Image
            source={{ uri: item.senderPicture }}
            style={styles.messageAvatar}
          />
        )}

        {/* Bubble content */}
        <View
          style={[
            styles.messageContent,
            isCurrentUser ? styles.sentContent : styles.receivedContent,
            {
              alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          {/* Render image if present */}
          {item.image && (
            <Image
              source={{ uri: item.image }}
              style={{
                width: 160,
                height: 160,
                borderRadius: 10,
                marginBottom: item.text ? 8 : 0,
                alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                backgroundColor: '#eee',
              }}
              resizeMode="cover"
            />
          )}
          {item.text ? (
            <Text
              style={[
                styles.messageText,
                isCurrentUser ? styles.sentText : styles.receivedText,
              ]}
            >
              {item.text}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  const otherUser = data?.messages?.length
    ? (data.messages.find((m: any) => m.direction === 'received')?.sender
      || data.messages[0].receiver)
    : null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [refetch]);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {isLoading && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}


        {!isLoading && (
          // {true && (
          <>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Icon name="chevron-back" size={24} color={theme.text} />
              </TouchableOpacity>

              <View style={styles.userInfo}>
                <Image
                  source={{ uri: otherUser?.profile_picture_url }}
                  style={styles.userImage}
                />
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{otherUser?.fullname ?? otherUser?.username ?? 'User'}</Text>
                  <Text style={styles.onlineStatus}>Online</Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: dark ? '#0D0D0D' : '#FAFAFA' }]} onPress={handleVoiceCall}>
                  <Image source={images.chatsPhone} style={{ width: 20, height: 20 }} tintColor={theme.text} />
                  {/* <Icon name="call" size={20} color={theme.text} /> */}
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleVideoCall}>
                  <MaterialIcons name="videocam" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Profile Card */}
            <FlatList
              ref={flatListRef}
              data={messages}
              style={styles.messagesContainer}
              keyExtractor={(item) => item.id}
              scrollEnabled={true}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
              ListHeaderComponent={
                <View style={[styles.profileCard, { backgroundColor: dark ? '#181818' : 'white' }]}>
                  <Image
                    source={{ uri: otherUser?.profile_picture_url }}
                    style={styles.profileImage}
                  />
                  <Text style={styles.profileName}>
                    {otherUser?.fullname ?? otherUser?.username ?? 'User'}
                  </Text>

                  <View style={styles.profileStats}>
                    <View style={styles.stat}>
                      <Image source={images.chatsFollower} style={{ width: 16, height: 16 }} tintColor={dark ? 'white' : 'black'} />
                      <Text style={[styles.statValue, { color: dark ? 'white' : 'black' }]}>0 Followers</Text>
                    </View>
                    <View style={styles.stat}>
                      <Image source={images.notifcationIcon} style={{ width: 16, height: 16 }} tintColor={dark ? 'white' : 'black'} />
                      <Text style={[styles.statValue, { color: dark ? 'white' : 'black' }]}>0 Posts</Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => hanldeViewProfile(12)} style={styles.viewProfileButton}>
                    <Text style={styles.viewProfileText}>View Profile</Text>
                  </TouchableOpacity>
                </View>
              }
              renderItem={renderMessage}
            />


            {/* Image preview above input bar */}
            {attachedImage && (
              <View style={{ alignItems: 'flex-end', marginRight: 16, marginBottom: 4 }}>
                <View style={{ position: 'relative', width: 80, height: 80 }}>
                  <Image
                    source={{ uri: attachedImage }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#ccc',
                    }}
                  />
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#ccc',
                      width: 24,
                      height: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                    }}
                    onPress={() => setAttachedImage(null)}
                  >
                    <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 16 }}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Input Container */}
            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
              {/* Attach photo icon */}
              <TouchableOpacity
                style={{ marginRight: 8 }}
                onPress={handlePickImage}
              >
                <Image
                  source={images.gallery || images.notifcationIcon}
                  style={{ width: 25, height: 25, }}
                />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.secondary,
                  color: theme.text
                }]}
                placeholder="Type a message"
                placeholderTextColor={theme.textSecondary}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newMessage.trim() && !attachedImage) && styles.sendButtonDisabled
                ]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim() && !attachedImage}
              >
                {sendMessageMutation.isLoading ? (
                  <Text>Sending...</Text>
                ) : (
                  <Image source={images.notifcationIcon} style={{ width: 25, height: 25 }} tintColor={dark ? 'white' : "black"} />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconStyle: {
    width: 30,
    height: 30,
    tintColor: '#fff', // Optional
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    // borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  onlineStatus: {
    fontSize: 12,
    color: '#4CD964',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA'
  },
  profileCard: {
    margin: 16,
    padding: 20,
    // backgroundColor: 'white', // ✅ try a dark solid color instead of 'transparent'
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#E50000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#E50000',
  },

  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  profileStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 14,
    color: '#fff',
  },
  viewProfileButton: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewProfileText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
    marginBottom: 10, // Space for input
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 14,
    paddingBottom: 4,
    alignItems: 'flex-end',
  },
  sentBubble: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',

  },
  receivedBubble: {
    justifyContent: 'flex-start',
    flexDirection: 'row',

  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 18,
  },
  sentContent: {
    backgroundColor: '#FF3B30',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  receivedContent: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  sentText: {
    color: '#fff',
  },
  receivedText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    // marginTop: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    // backgroundColor: '#ccc',
  },

  // Popup Styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  popupContainer: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  popupIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  popupTitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  costContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  costLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  costValue: {
    fontSize: 16,
  },
  popupButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  proceedButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Call Screen Styles
  callScreen: {
    flex: 1,
    position: 'relative',
  },
  callBackground: {
    width: width,
    height: height,
    position: 'absolute',
  },
  callOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  callContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  callTime: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  callSignal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signalBar: {
    width: 3,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  battery: {
    width: 24,
    height: 12,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  smallVideoContainer: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  smallVideo: {
    width: '100%',
    height: '100%',
  },
  callControls: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    transform: [{ translateX: "-50%" }],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    paddingBottom: 50,
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Voice Call Styles
  voiceCallScreen: {
    flex: 1,
    backgroundColor: '#FF3B30',
  },
  voiceCallContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  voiceCallContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceCallAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  voiceCallName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  voiceCallStatus: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },

});
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

const { width, height } = Dimensions.get('window');
import { RtcSurfaceView } from 'react-native-agora';
import VoiceCallScreenT from '@/components/VoiceCallScreen';


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

  const theme = {
    background: dark ? '#000000' : '#ffffff',
    secondary: dark ? '#181818' : '#f5f5f5',
    text: dark ? '#ffffff' : '#000000',
    textSecondary: dark ? '#999999' : '#666666',
    border: dark ? '#333333' : '#e0e0e0',
  };

  // Securely get token for API call
  const getToken = async () => {
    return await SecureStore.getItemAsync('auth_token');
  };
  const getUserData = async () => {
    return await SecureStore.getItemAsync('user_data');
    console.log("User data:", user_id);
    };

    
  // Fetch messages from backend (removing mockMessages)
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
  const [incomingCall, setIncomingCall] = useState<null | {
    channel_name: string;
    type: 'voice' | 'video';
    receiver_id: number;
    caller_id: number;
  }>(null);

  // console.log("Fetched messages:", data);
  // const receiverId=1;

  const firstMessage = data?.messages?.[0];

  const senderImage = firstMessage?.sender?.profile_picture_url || '';
  const receiverImage = firstMessage?.receiver?.profile_picture_url || '';
  const receiverName = firstMessage?.receiver?.fullname || 'User';

  // Transform fetched data
  const messages = data?.messages?.map((msg: any) => {
    return {
      id: String(msg.id),
      isCurrentUser: msg.direction === 'sent',
      text: msg.message,
      timestamp: new Date(msg.created_at),
      senderPicture: msg.direction === 'sent'
        ? msg.sender?.profile_picture_url
        : msg.receiver?.profile_picture_url,
    }
  }) || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const token = await getToken();
      if (!token) throw new Error('No token found');
      return sendChatMessage(
        { sender_id: 'current', receiver_id: user_id, message: messageText },
        token
      );
    },
    onSuccess: () => {
      setNewMessage('');
      refetch();
    },
  });

  // Handle send button
  const handleSendMessage = () => {
    if (newMessage.trim() && !sendMessageMutation.isLoading) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  // Auto-scroll after new messages
  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  }, [messages.length]);
  useEffect(() => {
    const pollIncomingCall = setInterval(async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        const res = await fetch('https://gympaddy.hmstech.xyz/api/user/incoming-call', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { call } = await res.json();
        console.log('Incoming call:', call);
        if (call && call.status === 'initiated' && call.channel_name) {
          if (call.type === 'voice') {
            setIncomingCall({
              channel_name: call.channel_name,
              type: call.type,
              receiver_id: call.caller_id, // 👈 this is important
            });
            setShowVoiceCall(true); // this will open your existing VoiceCallScreen
          } else if (call.type === 'video') {
            setShowVideoCall(true);
          }
        }
      } catch (error) {
        console.log('Incoming call polling failed', error);
      }
    }, 3000); // poll every 3s

    return () => clearInterval(pollIncomingCall);
  }, []);

  const handleVideoCall = () => {
    setShowVideoCallPopup(true);
  };
  const [channelName, setChannelName] = useState('');

const handleVoiceCall = async () => {
  try {
    const receiverId = user_id; // 👈 the person being called
    const channelName = `call_${Date.now()}_${receiverId}`; // unique per call
    const token = await getToken(); // ⬅️ use your stored bearer token

    // 1. Notify backend that call is starting
    const response = await fetch('https://gympaddy.hmstech.xyz/api/user/start-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiver_id: receiverId,
        channel_name: channelName,
        type: 'voice',
      }),
    });
    console.log('Call start response:', response);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Call start failed');
    }

    // 2. Save channel name and show call screen
    setChannelName(channelName);
    setShowVoiceCall(true);

  } catch (err) {
    console.error('Voice call error:', err);
    Alert.alert('Call Error', err.message);
  }
};


  const proceedVideoCall = () => {
    setShowVideoCallPopup(false);
    setShowVideoCall(true);
  };

  const closeVideoCallPopup = () => {
    setShowVideoCallPopup(false);
  };

  const endCall = () => {
    setShowVideoCall(false);
    setShowVoiceCall(false);
  };
  const hanldeViewProfile = (id: any) => {
    router.push({
      pathname: '/UserProfile',
      params: { user_id: id },
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
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.sentText : styles.receivedText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };


  // Video Call Popup Component
  const VideoCallPopup = () => (
    <Modal
      visible={showVideoCallPopup}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.popupOverlay}>
        <View style={[styles.popupContainer, { backgroundColor: theme.background }]}>
          <View style={styles.popupIcon}>
            <MaterialIcons name="videocam" size={32} color="#4CAF50" />
          </View>

          <Text style={[styles.popupTitle, { color: theme.text }]}>
            You are about to start a video call, and the charge for this call is not collected by GymPaddy but it will be sent directly to the wallet of the receiver
          </Text>

          <View style={[styles.costContainer, { backgroundColor: theme.secondary }]}>
            <Text style={[styles.costLabel, { color: theme.text }]}>Cost</Text>
            <Text style={[styles.costValue, { color: theme.textSecondary }]}>30GP/min</Text>
          </View>

          <View style={styles.popupButtons}>
            <TouchableOpacity
              style={styles.proceedButton}
              onPress={proceedVideoCall}
            >
              <Text style={styles.proceedButtonText}>Proceed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.secondary }]}
              onPress={closeVideoCallPopup}
            >
              <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );



  // 🟢 Video Call Screen Component
  const VideoCallScreen = () => {
    const { joined, localUid, remoteUid, endCall, channelName } = useAgoraCall({
      receiverId: Number(user_id),
      callType: 'video',
      onCallEnded: () => setShowVideoCall(false),
    });

    return (
      <Modal visible={showVideoCall} animationType="slide">
        <View style={styles.callScreen}>
          {joined && remoteUid !== null ? (
            <RtcSurfaceView
              style={styles.callBackground}
              channelId={channelName}
              uid={remoteUid}
              renderMode={RenderModeType.RenderModeHidden}
            />
          ) : (
            <Image source={{ uri: receiverImage }} style={styles.callBackground} />
          )}

          <View style={styles.callOverlay} />

          <SafeAreaView style={styles.callContainer}>
            {joined && localUid !== null ? (
              <RtcSurfaceView
                style={styles.smallVideo}
                channelId={channelName}
                uid={localUid}
                renderMode={RenderModeType.RenderModeHidden}
              />
            ) : (
              <Image source={{ uri: senderImage }} style={styles.smallVideo} />
            )}

            <View style={styles.callControls}>
              <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
                <Image source={images.liveClose} style={styles.iconStyle} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );

  };

  // 🟢 Voice Call Screen Component
  // const VoiceCallScreen = () => {
  //   const { joined, endCall } = useAgoraCall({
  //     receiverId: Number(user_id),
  //     callType: 'voice',
  //     onCallEnded: () => setShowVoiceCall(false),
  //   });

  //   return (
  //     <Modal visible={showVoiceCall} animationType="slide">
  //       <LinearGradient colors={['#FF3B30', '#8E44AD']} style={{ flex: 1 }}>
  //         <View style={styles.voiceCallScreen}>
  //           <SafeAreaView style={styles.voiceCallContainer}>
  //             <View style={styles.voiceCallContent}>
  //               <Image source={{ uri: receiverImage }} style={styles.voiceCallAvatar} />
  //               <Text style={styles.voiceCallName}>{receiverName}</Text>
  //               <Text style={styles.voiceCallStatus}>
  //                 {joined ? 'Connected' : 'Calling...'}
  //               </Text>
  //             </View>
  //             <View style={styles.callControls}>
  //               <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
  //                 <Image source={images.liveClose} style={styles.iconStyle} />
  //               </TouchableOpacity>
  //             </View>
  //           </SafeAreaView>
  //         </View>
  //       </LinearGradient>
  //     </Modal>
  //   );
  // };



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
  const renderCallScreen = () => {
    if (incomingCall?.type === 'voice' && showVoiceCall) {
      return (
        <VoiceCallScreenT
          receiverId={incomingCall.caller_id}
          channelName={incomingCall.channel_name}
          uid={12345}
          onCallEnded={() => {
            setShowVoiceCall(false);
            setIncomingCall(null);
          }}
        />
      );
    }

    if (showVoiceCall) {
      return (
        <VoiceCallScreenT
          receiverId={Number(user_id)}
          channelName={channelName}
          onCallEnded={() => setShowVoiceCall(false)}
        />
      );
    }

    if (showVideoCall) {
      return <VideoCallScreen />;
    }

    return null;
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

        {incomingCall && (
          <VoiceCallScreenT
            receiverId={incomingCall?.caller_id}
            channelName={incomingCall.channel_name}
            onCallEnded={() => {
              setShowVoiceCall(false);
              setIncomingCall(null);
            }}
          />
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
                <TouchableOpacity style={styles.actionButton} onPress={handleVoiceCall}>
                  <Image source={images.chatsPhone} style={{ width: 20, height: 20 }} tintColor={theme.text} />
                  {/* <Icon name="call" size={20} color={theme.text} /> */}
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleVideoCall}>
                  <MaterialIcons name="videocam" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
              <Image
                source={{ uri: otherUser?.profile_picture_url }}
                style={styles.profileImage}
              />
              <Text style={styles.profileName}>{otherUser?.fullname ?? otherUser?.username ?? 'User'}</Text>
              <View style={styles.profileStats}>
                <View style={styles.stat}>
                  <Image source={images.chatsFollower} style={{ width: 16, height: 16 }} tintColor={'white'} />
                  <Text style={styles.statValue}>
                    0 Followers
                  </Text>
                </View>
                <View style={styles.stat}>
                  {/* <Text style={styles.statIcon}>📝</Text> */}
                  <Image source={images.notifcationIcon} style={{ width: 16, height: 16 }} tintColor={'white'} />
                  <Text style={styles.statValue}>
                    0 Posts
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => hanldeViewProfile(12)} style={styles.viewProfileButton}>
                <Text style={styles.viewProfileText}>View Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              style={styles.messagesContainer}
              keyExtractor={(item) => item.id}
              scrollEnabled={true}
              renderItem={renderMessage}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />

            {/* Input Container */}
            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
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
                  !newMessage.trim() && styles.sendButtonDisabled
                ]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
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

        <VideoCallPopup />
        {/* Modals */}
        {showVideoCall && <VideoCallScreen />}
        {/* {showVoiceCall && <VoiceCallScreen />} */}
        {/* <VoiceCallScreen /> */}
        {renderCallScreen()}
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
    borderBottomWidth: 1,
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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#ff5e62',
    borderRadius: 16,
    alignItems: 'center',
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
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  sentBubble: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse', // avatar on the right

  },
  receivedBubble: {
    justifyContent: 'flex-start',
    flexDirection: 'row', // avatar on the left

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
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFD700',
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
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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons as Icon, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { images } from '@/constants';

const { width, height } = Dimensions.get('window');

const dark = true; // You can change this to toggle theme

// Mock data for demonstration
const mockUser = {
  id: '1',
  username: 'Christopher',
  profile_img: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
  online: true,
  followers: 1500,
  posts: 70,
};

const mockMessages = [
  {
    id: '1',
    senderId: '1',
    text: 'Hey! How are you doing?',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    senderId: 'current',
    text: 'I\'m doing great! Just finished my workout.',
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: '3',
    senderId: '1',
    text: 'That\'s awesome! What kind of workout?',
    timestamp: new Date(Date.now() - 3400000),
  },
  {
    id: '4',
    senderId: 'current',
    text: 'Yeah that is great, i have been pretty occupied these past few weeks',
    timestamp: new Date(Date.now() - 3300000),
  },
];

export default function MessageChat() {
  const params = useLocalSearchParams();
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showVideoCallPopup, setShowVideoCallPopup] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const flatListRef = useRef<FlatList<any>>(null);

  const theme = {
    background: dark ? '#000000' : '#ffffff',
    secondary: dark ? '#181818' : '#f5f5f5',
    text: dark ? '#ffffff' : '#000000',
    textSecondary: dark ? '#999999' : '#666666',
    border: dark ? '#333333' : '#e0e0e0',
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        senderId: 'current',
        text: newMessage.trim(),
        timestamp: new Date(),
      };
      setMessages([...messages, message]);
      setNewMessage('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd();
      }, 100);
    }
  };

  const handleVideoCall = () => {
    setShowVideoCallPopup(true);
  };

  const handleVoiceCall = () => {
    setShowVoiceCall(true);
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

  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.senderId === 'current';
    const showAvatar = !isCurrentUser &&
      (index === 0 || messages[index - 1].senderId !== item.senderId);

    return (
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.sentBubble : styles.receivedBubble
        ]}
      >
        {showAvatar && (
          <Image
            source={{ uri: mockUser.profile_img }}
            style={styles.messageAvatar}
          />
        )}
        <View style={[
          styles.messageContent,
          isCurrentUser ? styles.sentContent : styles.receivedContent
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.sentText : styles.receivedText
          ]}>
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

  // Video Call Screen Component
  const VideoCallScreen = () => (
    <Modal
      visible={showVideoCall}
      animationType="slide"
    >
      <View style={styles.callScreen}>
        <Image
          source={{ uri: mockUser.profile_img }}
          style={styles.callBackground}
        />
        <View style={styles.callOverlay} />

        <SafeAreaView style={styles.callContainer}>
          <View style={styles.smallVideoContainer}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg' }}
              style={styles.smallVideo}
            />
          </View>

          <View style={styles.callControls}>
            <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
              <Image source={images.liveClose} style={{width:"100%",height:'100%'}} />
              {/* <Icon name="close" size={24} color="#fff" /> */}
            </TouchableOpacity>
            <TouchableOpacity style={styles.muteButton}>
              <Image source={images.livecamera} style={{width:"100%",height:'100%'}} />
              {/* <MaterialIcons name="mic-off" size={24} color="#fff" /> */}
            </TouchableOpacity>
            <TouchableOpacity style={styles.speakerButton}>
              <Image source={images.liveaudio} style={{width:"100%",height:'100%'}} />
              {/* <MaterialIcons name="volume-up" size={24} color="#fff" /> */}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );

  // Voice Call Screen Component
  const VoiceCallScreen = () => (
    <Modal
      visible={showVoiceCall}
      animationType="slide"
    >
      <LinearGradient
        // 'linear-gradient(135deg, #FF3B30 0%, #8E44AD 100%)'
        colors={['#FF3B30', '#8E44AD']}
        style={{ flex: 1 }}
      >
        <View style={styles.voiceCallScreen}>
          <SafeAreaView style={styles.voiceCallContainer}>
            <View style={styles.voiceCallContent}>
              <Image
                source={{ uri: mockUser.profile_img }}
                style={styles.voiceCallAvatar}
              />
              <Text style={styles.voiceCallName}>Adam235</Text>
              <Text style={styles.voiceCallStatus}>Calling....</Text>
            </View>

            <View style={styles.callControls}>
              <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
                <Image source={images.liveClose} style={{width:"100%",height:'100%'}} />
                {/* <Icon name="close" size={24} color="#fff" /> */}
              </TouchableOpacity>
              <TouchableOpacity style={styles.muteButton}>
                {/* <MaterialIcons name="mic-off" size={24} color="#fff" /> */}
                <Image source={images.livecamera} style={{width:"100%",height:'100%'}} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.speakerButton}>
                <Image source={images.liveaudio} style={{width:"100%",height:'100%'}} />
                {/* <MaterialIcons name="volume-up" size={24} color="#fff" /> */}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </LinearGradient>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }}>
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
              source={{ uri: mockUser.profile_img }}
              style={styles.userImage}
            />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.text }]}>{mockUser.username}</Text>
              {mockUser.online && (
                <Text style={styles.onlineStatus}>Online</Text>
              )}
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

        <ScrollView style={{ flex: 1 }}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <Image
              source={{ uri: mockUser.profile_img }}
              style={styles.profileImage}
            />
            <Text style={styles.profileName}>{mockUser.username}</Text>
            <View style={styles.profileStats}>
              <View style={styles.stat}>
                <Image source={images.chatsFollower} style={{ width: 16, height: 16 }}  tintColor={'white'} />
                <Text style={styles.statValue}>
                  {mockUser.followers?.toLocaleString()} Followers
                </Text>
              </View>
              <View style={styles.stat}>
                {/* <Text style={styles.statIcon}>📝</Text> */}
                <Image source={images.notifcationIcon} style={{ width: 16, height: 16 }} tintColor={'white'}  />
                <Text style={styles.statValue}>
                  {mockUser.posts} Posts
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewProfileButton}>
              <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            style={styles.messagesContainer}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={renderMessage}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
        </ScrollView>

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
            <Image source={images.notifcationIcon} style={{ width: 25, height: 25 }} tintColor={dark ? 'white' : "black"}  />
            {/* <Icon name="send" size={20} color="#fff" /> */}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Modals */}
      <VideoCallPopup />
      <VideoCallScreen />
      <VoiceCallScreen />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  receivedBubble: {
    justifyContent: 'flex-start',
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
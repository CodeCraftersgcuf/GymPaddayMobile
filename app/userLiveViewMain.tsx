import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons as Icon } from '@expo/vector-icons';
import GiftsPanel from '@/components/Social/live/GiftsPanel';
import TopupPanel from '@/components/Social/live/TopupPanel';
import SendCoinsPanel from '@/components/Social/live/SendCoinsPanel';

const { width, height } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  avatar: string;
  hasGift?: boolean;
  giftCount?: number;
}

interface GiftItem {
  id: string;
  emoji: string;
  name: string;
  price: number;
  currency: string;
}

type PanelType = 'gifts' | 'topup' | 'sendCoins' | 'none';

const User_liveViewMain: React.FC = () => {
  const router = useRouter();
  const [dark, setDark] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [balance, setBalance] = useState<number>(200000);
  const [activePanel, setActivePanel] = useState<PanelType>('none');
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user: 'Amara',
      message: 'This is a beautiful scenery',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
    },
    {
      id: '2',
      user: 'Sandra',
      message: 'This is a beautiful scenery',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
    },
    {
      id: '3',
      user: 'Adewale',
      message: 'This is a beautiful scenery',
      avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
    },
    {
      id: '4',
      user: 'Samantha',
      message: 'Sent you a gift',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
      hasGift: true,
      giftCount: 3,
    },
  ]);

  const themeStyles = {
    backgroundColor: dark ? '#000000' : '#ffffff',
    secondaryBackground: dark ? '#181818' : '#f5f5f5',
    textColor: dark ? '#ffffff' : '#000000',
    textColorSecondary: dark ? '#cccccc' : '#666666',
  };

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        user: 'You',
        message: message.trim(),
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
      };
      setChatMessages([...chatMessages, newMessage]);
      setMessage('');
    }
  };

  const handleGiftSelect = (gift: GiftItem) => {
    setSelectedGift(gift);
    setActivePanel('sendCoins');
  };

  const handleTopupSuccess = (amount: number) => {
    setBalance(prevBalance => prevBalance + amount);
    setActivePanel('gifts');
  };

  const handleSendSuccess = (amount: number) => {
    setBalance(prevBalance => prevBalance - amount);
    setActivePanel('none');

    // Add gift message to chat
    if (selectedGift) {
      const giftMessage: ChatMessage = {
        id: Date.now().toString(),
        user: 'You',
        message: `Sent ${selectedGift.name}`,
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop',
        hasGift: true,
        giftCount: 1,
      };
      setChatMessages(prev => [...prev, giftMessage]);
    }
  };

  const closePanel = () => {
    setActivePanel('none');
    setSelectedGift(null);
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'gifts':
        return (
          <GiftsPanel
            dark={dark}
            balance={balance}
            onGiftSelect={handleGiftSelect}
            onTopupPress={() => setActivePanel('topup')}
          />
        );
      case 'topup':
        return (
          <TopupPanel
            dark={dark}
            balance={balance}
            onTopupSuccess={handleTopupSuccess}
          />
        );
      case 'sendCoins':
        return selectedGift ? (
          <SendCoinsPanel
            dark={dark}
            balance={balance}
            selectedGift={selectedGift}
            onSendSuccess={handleSendSuccess}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeStyles.backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="chevron-back" size={24} color={themeStyles.textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeStyles.textColor }]}>
          Live Streaming
        </Text>
      </View>

      {/* Video Background */}
      <View style={[styles.videoContainer]}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/268533/pexels-photo-268533.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop',
          }}
          style={styles.backgroundVideo}
        />

        {/* Chat Messages Overlay - Only show when no panel is active */}
          <View style={styles.chatOverlay}>
            <ScrollView style={styles.chatContainer} showsVerticalScrollIndicator={false}>
              {chatMessages.map((chat) => (
                <View key={chat.id} style={styles.chatMessage}>
                  <Image source={{ uri: chat.avatar }} style={styles.avatar} />
                  <View style={[styles.messageContainer, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <Text style={styles.username}>{chat.user}</Text>
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
              ))}
            </ScrollView>
          </View>
      </View>

      {activePanel !== 'none' && (
        <Modal
          visible={activePanel !== 'none'}
          transparent={true}
          animationType="fade"
          onRequestClose={closePanel}
        >
          {/* <View style={{flex:1}}> */}
            <Pressable style={styles.modalBackdrop} onPress={closePanel} />
            <View style={styles.bottomPanelContainer}>
              {renderPanel()}
            </View>
          {/* </View> */}
        </Modal>
      )}

      {/* Bottom Input - Only show when no panel is active */}
      {activePanel === 'none' && (
        <View style={[styles.bottomContainer, { backgroundColor: themeStyles.backgroundColor }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: themeStyles.secondaryBackground,
                color: themeStyles.textColor
              }]}
              placeholder="Type a message"
              placeholderTextColor={themeStyles.textColorSecondary}
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Icon name="send" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.giftButton}
              onPress={() => setActivePanel('gifts')}
            >
              <Icon name="gift" size={24} color="#ff0000" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // Add to your StyleSheet.create
  modalBackdrop: {
    height:300,
    // backgroundColor:"red",
    backgroundColor: 'rgba(0,0,0,0.2)',
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    // bottom: 0,
    zIndex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: "50%",
    transform: [{ translateX: -30 }],
    fontSize: 18,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoContainerSmall: {
    height: 200,
    flex: 0,
  },
  backgroundVideo: {
    width: '93%',
    height: '100%',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  chatOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    maxHeight: 300,
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
  giftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftEmoji: {
    fontSize: 20,
    marginRight: 4,
  },
  giftBadge: {
    backgroundColor: '#ff0000',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  giftCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  panelContainer: {
    flex: 1,
    maxHeight:"70%",
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 20,
  },
  giftButton: {
    backgroundColor: 'transparent',
    padding: 8,
  },
  bottomPanelContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    // padding: 16,
    // paddingBottom: 32,
  },
});

export default User_liveViewMain;
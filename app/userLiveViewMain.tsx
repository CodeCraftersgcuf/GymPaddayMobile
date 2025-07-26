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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons as Icon } from '@expo/vector-icons';
import GiftsPanel from '@/components/Social/live/GiftsPanel';
import TopupPanel from '@/components/Social/live/TopupPanel';
import SendCoinsPanel from '@/components/Social/live/SendCoinsPanel';
import { useLocalSearchParams } from 'expo-router';
import LiveStreamingPlayer from '@/components/Social/live/LiveStreamingPlayer';
import WebView from 'react-native-webview';
import { useLiveStreamChats } from '@/utils/hooks/useLiveStreamChats';
import { useSendLiveStreamMessage } from '@/utils/hooks/useSendLiveStreamMessage';
import * as SecureStore from 'expo-secure-store';

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
  quantity?: number;
}

type PanelType = 'gifts' | 'topup' | 'sendCoins' | 'none';

const User_liveViewMain: React.FC = () => {
  const { channelName, id } = useLocalSearchParams<{ channelName: string, id: string }>();

  const router = useRouter();
  const [dark, setDark] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [balance, setBalance] = useState<number>(200000);
  const [activePanel, setActivePanel] = useState<PanelType>('none');
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([

  ]);

  const [loadingBalance, setLoadingBalance] = useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        setLoadingBalance(true); // start loading
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) throw new Error('No token founds');

        const response = await fetch('https://gympaddy.hmstech.xyz/api/user/balance', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const result = await response.json();
        console.log('Balance fetch result:', result);

        if (response.ok && result.status === 'success') {
          setBalance(Number(result.balance));
        } else {
          Alert.alert('Error', result.message || 'Failed to fetch balance');
        }
      } catch (error) {
        console.error('Balance fetch error:', error);
        Alert.alert('Error', 'Unable to fetch wallet balance.');
      } finally {
        setLoadingBalance(false); // stop loading
      }
    })();
  }, []);
  const themeStyles = {
    backgroundColor: dark ? '#000000' : '#ffffff',
    secondaryBackground: dark ? '#181818' : '#f5f5f5',
    textColor: dark ? '#ffffff' : '#000000',
    textColorSecondary: dark ? '#cccccc' : '#666666',
  };
  const { data: chats = [], isLoading } = useLiveStreamChats(id);
  const { mutate: sendChatMessage, isPending } = useSendLiveStreamMessage(id);
  console.log("chats", chats)
  useEffect(() => {
    if (chats.length > 0) {
      const formatted = chats.map((msg: any) => ({
        id: msg.id.toString(),
        user: msg.user?.fullname || 'User',
        message: msg.message,
        avatar: msg.user?.profile_picture_url || 'https://ui-avatars.com/api/?name=User',
      }));
      setChatMessages(formatted);
    }
  }, [chats]);

  const sendMessage = () => {
    if (!message.trim()) return;
    sendChatMessage({message:message.trim()});
    setMessage('');
  };

  const handleGiftSelect = (gift: GiftItem, quantity: number = 1) => {
    setSelectedGift({ ...gift, quantity }); // Optional: add quantity into gift object
    setActivePanel('sendCoins');
  };

  const handleTopupSuccess = async (amount: number) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No token found');

      const response = await fetch('https://gympaddy.hmstech.xyz/api/user/top-up', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errRes = await response.json();
        console.error('❌ Top-up API error:', errRes);
        alert('Top-up failed: ' + (errRes.message || 'Unknown error'));
        return;
      }

      const data = await response.json();
      console.log('✅ Top-up recorded:', data);

      // Update local balance
      setBalance(prevBalance => prevBalance + amount);
      setActivePanel('gifts');
    } catch (error) {
      console.error('❌ Top-up request failed:', error);
      alert('Top-up request failed. Please try again.');
    }
  };

  const handleSendSuccess = (amount: number) => {
    setBalance(prevBalance => prevBalance - (amount*10));
    setActivePanel('none');
    const giftText = `Sent ${selectedGift?.name} x${amount}`;
    // Add gift message to chat
    sendChatMessage({message:giftText,type:"gift",amount:amount*10})
   
  };

  const closePanel = () => {
    setActivePanel('none');
    setSelectedGift(null);
  };

  const [giftQuantities, setGiftQuantities] = React.useState<{ [id: string]: number }>({});

  const updateQuantity = (id: string, change: number) => {
    setGiftQuantities(prev => {
      const newQty = Math.max(1, (prev[id] || 1) + change);
      return { ...prev, [id]: newQty };
    });
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
        {channelName ? (
          <WebView
            source={{
              uri: `https://hmstech.xyz/live.html?channel=${channelName}`,
            }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
            style={{ flex: 1 }}
          />

        ) : (
          <Text style={{ color: 'white', textAlign: 'center', marginTop: 20 }}>
            No channel specified
          </Text>
        )}
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
    height: 300,
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
    maxHeight: "70%",
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